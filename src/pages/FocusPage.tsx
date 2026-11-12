import { getGrowthStage } from "@/features/garden/growth";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Pause,
  Play,
  Square,
  Sprout,
  Coffee,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useGarden } from "@/hooks/useGarden";
import { useNow } from "@/hooks/useNow";
import { elapsedMs, isActive } from "@/features/focus/timer";
import { PlantArt } from "@/features/garden/PlantArt";
import { plantCatalog } from "@/features/garden/catalog";
import { gardenService } from "@/services";
import { clock } from "@/lib/utils";
import { playSound, prepareSound } from "@/features/focus/sound";
export const FocusPage = () => {
  const { sessionId } = useParams();
  const { data, busy, run, refresh } = useGarden();
  const now = useNow(250);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [soundNote, setSoundNote] = useState("");
  const settling = useRef(false);
  const notified = useRef("");
  const session = data?.sessions.find((session) => session.id === sessionId);
  const elapsed = session ? elapsedMs(session, now) : 0;
  const due =
    !!session &&
    session.status === "running" &&
    elapsed >= session.plannedMinutes * 60000;
  useEffect(() => {
    if (!due || settling.current) return;
    settling.current = true;
    void refresh().finally(() => {
      settling.current = false;
    });
  }, [due, refresh, now]);
  const breakFinished = !!session?.breakEndsAt && now >= session.breakEndsAt;
  useEffect(() => {
    if (
      !session ||
      session.status !== "completed" ||
      !data?.settings.soundEnabled
    )
      return;
    const key = `${session.id}-${breakFinished ? "break" : "complete"}`;
    if (notified.current === key) return;
    notified.current = key;
    void playSound().catch((error) => setSoundNote(error.message));
  }, [session, data?.settings.soundEnabled, breakFinished]);
  if (!session)
    return (
      <div className="empty-state">
        <h1>没有找到这段专注</h1>
        <p>从一个小任务，开始新的成长。</p>
        <Link to="/">返回花园</Link>
      </div>
    );
  const active = isActive(session);
  const completed = session.status === "completed";
  const breaking = completed && session.breakEndsAt !== null && !breakFinished;
  const task = data!.tasks.find((task) => task.id === session.taskId);
  const action = async (
    type: Parameters<typeof gardenService.sessionAction>[1],
  ) => {
    await run(() => gardenService.sessionAction(session.id, type));
  };
  const next = async () => {
    const result = await run(() => gardenService.start(session.taskId));
    if (result) {
      setSoundNote("");
      void navigate(`/focus/${result.id}`);
    }
  };
  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        返回我的花园
      </Link>
      <section className="focus-page">
        <div className="eyebrow">
          <Sprout size={15} />
          {breaking
            ? "REST & RECHARGE"
            : completed
              ? "A LITTLE MOMENT OF GROWTH"
              : "ONE THING AT A TIME"}
        </div>
        <h1>
          {breaking
            ? "休息一下，让思绪透透气"
            : completed
              ? "认真投入的你，收获了一点美好"
              : session.status === "abandoned"
                ? "停下来，也可以重新开始"
                : "此刻，只专注这一件事"}
        </h1>
        <p className="focus-task">{session.taskTitle}</p>
        <div className={`focus-orbit ${completed ? "celebrate" : ""}`}>
          <div
            className="orbit-ring"
            style={{
              background: `conic-gradient(#769468 ${Math.min(1, elapsed / (session.plannedMinutes * 60000)) * 360}deg, #e6ebdf 0deg)`,
            }}
          />
          <PlantArt
            type={session.plantType}
            progress={
              completed ? 1 : elapsed / (session.plannedMinutes * 60000)
            }
          />
          {active && (
            <span className="growth-label">
              {session.status === "paused"
                ? "生长暂停中"
                : getGrowthStage(elapsed / (session.plannedMinutes * 60000))
                    .message}
            </span>
          )}
        </div>
        {active ? (
          <>
            <div className="timer" role="timer" aria-label="剩余专注时间">
              {clock(session.plannedMinutes * 60000 - elapsed)}
            </div>
            <p className="timer-caption">
              {session.status === "paused"
                ? "时间已停下，准备好后再继续"
                : `本轮 ${session.plannedMinutes} 分钟 · 让专注自然发生`}
            </p>
            <div className="focus-controls">
              <Button
                disabled={busy}
                size="lg"
                onClick={() =>
                  void action(session.status === "paused" ? "resume" : "pause")
                }
              >
                {session.status === "paused" ? (
                  <Play size={17} />
                ) : (
                  <Pause size={17} />
                )}{" "}
                {session.status === "paused" ? "继续专注" : "暂停一下"}
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                size="lg"
                onClick={() => setConfirm(true)}
              >
                <Square size={15} />
                提前结束
              </Button>
            </div>
            <p className="gentle-note">不用时刻盯着时间，小植物会陪着你。</p>
          </>
        ) : completed ? (
          <>
            <h2 className="reward-title">
              {breaking
                ? clock(session.breakEndsAt! - now)
                : breakFinished
                  ? "休息结束，欢迎回来"
                  : `+1 株${plantCatalog[session.plantType].name}`}
            </h2>
            <p className="timer-caption" role="status">
              {breaking
                ? "休息时间不会计入专注时长"
                : breakFinished
                  ? "下一轮由你决定，不会自动开始。"
                  : `本轮专注 ${clock(session.actualMs)} · ${plantCatalog[session.plantType].description}`}
            </p>
            <div className="focus-controls wrap">
              {breaking ? (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void action("skipBreak")}
                >
                  跳过休息
                </Button>
              ) : (
                <>
                  {session.breakEndsAt === null && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        if (data!.settings.soundEnabled)
                          void prepareSound().catch((error) =>
                            setSoundNote(error.message),
                          );
                        void action("break");
                      }}
                    >
                      <Coffee size={16} />
                      休息 {data!.settings.breakMinutes} 分钟
                    </Button>
                  )}
                  {task?.status === "pending" && (
                    <Button disabled={busy} onClick={() => void next()}>
                      <Play size={16} />
                      继续专注
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="completion-links">
              {task?.status === "pending" && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    void run(() => gardenService.completeTask(session.taskId))
                  }
                >
                  <Check size={16} />
                  标记任务完成
                </Button>
              )}
              {task?.status === "completed" && (
                <span>
                  <Check size={16} />
                  任务已完成
                </span>
              )}
              <Link to="/">
                回到花园 <ArrowRight size={15} />
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2>这一轮已结束</h2>
            <p className="timer-caption">
              已记录 {clock(session.actualMs)}{" "}
              的努力。本轮未获得植物，下一次继续生长。
            </p>
            <Link to="/">
              <Button>回到花园</Button>
            </Link>
          </>
        )}
        {soundNote && (
          <p role="status" className="sound-note">
            {soundNote}
          </p>
        )}
      </section>
      {confirm && (
        <ConfirmDialog
          title="要提前结束这轮专注吗？"
          description="已专注的时间会保留在成长记录里。本轮将标记为已放弃，不会获得植物奖励。"
          label="结束本轮"
          busy={busy}
          onClose={() => setConfirm(false)}
          onConfirm={() =>
            void (async () => {
              await action("abandon");
              setConfirm(false);
            })()
          }
        />
      )}
    </>
  );
};
