import { useNow } from "@/hooks/useNow";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Plus,
  ArrowUpRight,
  Play,
  Pencil,
  Trash2,
  Check,
  Clock3,
  Sprout,
  Sun,
  CircleCheck,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TaskForm } from "@/features/tasks/TaskForm";
import { PlantArt } from "@/features/garden/PlantArt";
import { plantCatalog } from "@/features/garden/catalog";
import { useGarden } from "@/hooks/useGarden";
import { gardenService } from "@/services";
import { sessionsOnDate, totalFocusMs } from "@/features/records/statistics";
import { localDate, minutes } from "@/lib/utils";
import type { Task } from "@/types";
export const HomePage = () => {
  const now = useNow();
  const { data, busy, run } = useGarden();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"pending" | "completed">("pending");
  if (!data) return null;
  const today = localDate(now);
  const todaySessions = sessionsOnDate(data.sessions, today);
  const completed = todaySessions.filter(
    (session) => session.status === "completed",
  );
  const tasks = data.tasks.filter((task) => task.status === filter);
  const todayMs = totalFocusMs(todaySessions, now);
  const start = async (id: string) => {
    const session = await run(() => gardenService.start(id));
    if (session) void navigate(`/focus/${session.id}`);
  };
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <Sun size={15} />
            {new Date(now).toLocaleDateString("zh-CN", {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </div>
          <h1>
            今天，也种下一点美好<span>。</span>
          </h1>
          <p>把注意力留给重要的事，让每一次专注都有迹可循。</p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus size={17} />
          新建任务
        </Button>
      </section>
      <section className="stats-grid" aria-label="今日统计">
        <div className="stat-card">
          <span className="stat-icon sage">
            <Clock3 size={21} />
          </span>
          <div>
            <span>今日专注</span>
            <strong>
              {minutes(todayMs)}
              <small>分钟</small>
            </strong>
          </div>
          <span className="stat-detail">每一分钟都算数</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon sand">
            <CircleCheck size={21} />
          </span>
          <div>
            <span>完成专注</span>
            <strong>
              {completed.length}
              <small>轮</small>
            </strong>
          </div>
          <span className="stat-detail">慢慢来，也很棒</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon rose">
            <Sprout size={21} />
          </span>
          <div>
            <span>花园植物</span>
            <strong>
              {data.plants.length}
              <small>株</small>
            </strong>
          </div>
          <span className="stat-detail">认真生活的礼物</span>
        </div>
      </section>
      <section className="garden-panel">
        <div className="garden-heading">
          <div>
            <span className="eyebrow">A LITTLE GROWTH, EVERY DAY</span>
            <h2>你的专注，正在生长</h2>
            <p>
              {data.plants.length
                ? "每一株小植物，都藏着一段认真投入的时光。"
                : "给自己一段不被打扰的时间，收获第一株小植物。"}
            </p>
          </div>
          <Link to="/collection">
            逛逛收藏 <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="garden-scene">
          <span className="scene-sun" />
          <span className="scene-cloud cloud-one" />
          <span className="scene-cloud cloud-two" />
          <span className="garden-ground" />
          {data.plants.length ? (
            data.plants.slice(-5).map((plant, index) => (
              <div
                className="scene-plant"
                style={{ left: `${16 + index * 16}%` }}
                key={plant.id}
              >
                <PlantArt type={plant.type} />
              </div>
            ))
          ) : (
            <>
              <div className="scene-plant demo-left">
                <PlantArt type="fern" />
              </div>
              <div className="scene-plant demo-center">
                <PlantArt type="daisy" />
              </div>
              <div className="scene-plant demo-right">
                <PlantArt type="tulip" />
              </div>
              <span className="scene-caption">
                <Leaf size={13} /> 成长预览 · 你的花园从第一轮专注开始
              </span>
            </>
          )}
        </div>
        <div className="garden-foot">
          <span>
            <span className="status-dot" />{" "}
            {data.plants.length
              ? `已收获 ${data.plants.length} 株植物`
              : "花园已准备好，等待你的第一颗种子"}
          </span>
          <span>保持专注，静待花开</span>
        </div>
      </section>
      <section className="tasks-section">
        <div className="section-heading">
          <div>
            <h2>
              我的任务{" "}
              <span>
                {data.tasks.filter((task) => task.status === "pending").length}
              </span>
            </h2>
            <p>一次只做一件事，也是一种超能力。</p>
          </div>
          <div className="segmented">
            {(["pending", "completed"] as const).map((value) => (
              <button
                key={value}
                className={filter === value ? "selected" : ""}
                onClick={() => setFilter(value)}
              >
                {value === "pending" ? "待完成" : "已完成"}
              </button>
            ))}
          </div>
        </div>
        <div className="task-list">
          {tasks.length ? (
            tasks.map((task) => (
              <article
                className={`task-row ${task.status === "completed" ? "done" : ""}`}
                key={task.id}
              >
                <button
                  aria-label={`完成任务：${task.title}`}
                  className="task-check"
                  disabled={busy || task.status === "completed"}
                  onClick={() =>
                    void run(() => gardenService.completeTask(task.id))
                  }
                >
                  {task.status === "completed" && <Check size={15} />}
                </button>
                <div className="task-details">
                  <h3>{task.title}</h3>
                  {task.notes && <p>{task.notes}</p>}
                  <div className="task-meta">
                    <span>
                      <Clock3 size={13} />
                      {task.plannedMinutes} 分钟
                    </span>
                    <span>
                      <Sprout size={13} />
                      {plantCatalog[task.plantType].name}
                    </span>
                    <span>
                      {
                        data.sessions.filter(
                          (session) =>
                            session.taskId === task.id &&
                            session.status === "completed",
                        ).length
                      }{" "}
                      轮已完成
                    </span>
                  </div>
                </div>
                <div className="task-actions">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`编辑任务：${task.title}`}
                    onClick={() => setEditing(task)}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`删除任务：${task.title}`}
                    onClick={() => setDeleting(task)}
                  >
                    <Trash2 size={15} />
                  </Button>
                  {task.status === "pending" && (
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() => void start(task.id)}
                    >
                      <Play size={14} />
                      开始专注
                    </Button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <Sprout size={29} />
              </span>
              <h3>
                {filter === "pending"
                  ? "一颗种子，一个小小的开始"
                  : "好事正在路上"}
              </h3>
              <p>
                {filter === "pending"
                  ? "把脑海中的计划写下来，为它留一段专注的时光。"
                  : "完成任务后，就能在这里看见你的进步。"}
              </p>
              {filter === "pending" && (
                <Button variant="outline" onClick={() => setEditing("new")}>
                  <Plus size={15} />
                  创建第一个任务
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
      <div className="daily-quote">
        “ 不用一下子变得很厉害，每天长大一点点就好。 ”
        <span>给正在努力的你</span>
      </div>
      {editing && (
        <TaskForm
          task={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="移除这份计划？"
          description={`将删除「${deleting.title}」。已有专注记录和获得的植物会保留；若正在专注，请先处理当前记录。`}
          label="删除任务"
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            void (async () => {
              const result = await run(() =>
                gardenService.deleteTask(deleting.id),
              );
              if (result) setDeleting(null);
            })()
          }
        />
      )}
    </>
  );
};
