import { useNow } from "@/hooks/useNow";
import { useState } from "react";
import { Clock3, CircleCheck, History, Sprout } from "lucide-react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { useGarden } from "@/hooks/useGarden";
import { localDate, clock, minutes } from "@/lib/utils";
import { elapsedMs, isActive } from "@/features/focus/timer";
import { sessionsOnDate, totalFocusMs } from "@/features/records/statistics";
const statusNames = {
  running: "进行中",
  paused: "已暂停",
  completed: "已完成",
  abandoned: "已放弃",
};
export const RecordsPage = () => {
  const now = useNow();
  const { data } = useGarden();
  const [date, setDate] = useState(() => localDate(Date.now()));
  if (!data) return null;
  const total = totalFocusMs(data.sessions, now);
  const today = totalFocusMs(
    sessionsOnDate(data.sessions, localDate(now)),
    now,
  );
  const sessions = sessionsOnDate(data.sessions, date);
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">YOUR GROWTH JOURNAL</div>
          <h1>每一份努力，都有回响。</h1>
          <p>那些认真度过的时光，正在成为你的养分。</p>
        </div>
      </section>
      <div className="stats-grid">
        <div className="stat-card">
          <Clock3 />
          <div>
            <span>今日专注</span>
            <strong>
              {minutes(today)}
              <small>分钟</small>
            </strong>
          </div>
        </div>
        <div className="stat-card">
          <History />
          <div>
            <span>累计专注</span>
            <strong>
              {minutes(total)}
              <small>分钟</small>
            </strong>
          </div>
        </div>
        <div className="stat-card">
          <CircleCheck />
          <div>
            <span>累计完成</span>
            <strong>
              {
                data.sessions.filter(
                  (session) => session.status === "completed",
                ).length
              }
              <small>轮</small>
            </strong>
          </div>
        </div>
      </div>
      <section className="records-panel">
        <div className="section-heading">
          <h2>专注足迹</h2>
          <label className="date-filter">
            查看日期
            <Input
              aria-label="查看日期"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
        <p className="subtle">
          按本地结束日期归档；进行中的记录按开始日期展示，放弃记录的实际投入也计入统计。
        </p>
        {sessions.length ? (
          <div className="record-list">
            {sessions.map((session) => (
              <article className="record-row" key={session.id}>
                <span
                  className={`record-icon ${session.status === "abandoned" ? "muted" : ""}`}
                >
                  <Sprout size={22} />
                </span>
                <div>
                  <h3>{session.taskTitle}</h3>
                  <p>
                    {new Date(session.startedAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    开始 · 计划 {session.plannedMinutes} 分钟
                  </p>
                </div>
                <strong>{clock(elapsedMs(session, now))}</strong>
                <span className={`badge ${session.status}`}>
                  {statusNames[session.status]}
                </span>
                {isActive(session) && (
                  <Link to={`/focus/${session.id}`}>继续</Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <History size={32} />
            <h3>这一天，还没有专注足迹</h3>
            <p>换个日期看看，或从今天的一件小事开始。</p>
            <Link to="/">去我的花园</Link>
          </div>
        )}
      </section>
    </>
  );
};
