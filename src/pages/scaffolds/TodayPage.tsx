import { useState } from "react";
import { Link } from "react-router";
import {
  Plus,
  Clock3,
  ClipboardCheck,
  ListTodo,
  ArrowUpRight,
  Sprout,
  PencilLine,
  Play,
  Flower2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/PageHeading";
import { GardenScene } from "@/components/garden/GardenScene";
export const TodayPage = () => {
  const [date] = useState(() =>
    new Date().toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
  );
  const statistics = [
    { title: "今日计划", unit: "个任务", icon: ListTodo, color: "olive" },
    { title: "已完成", unit: "个任务", icon: ClipboardCheck, color: "ochre" },
    { title: "今日专注", unit: "分钟", icon: Clock3, color: "terracotta" },
  ];
  return (
    <>
      <PageHeading
        title="今日任务"
        description="把想做的事，种进今天的花园。"
        eyebrow={`${date} · 今天也为自己留一点时间`}
        action={
          <div className="fg-pending-action">
            <Button disabled>
              <Plus size={18} aria-hidden="true" />
              新建任务
            </Button>
            <span>任务功能即将开放</span>
          </div>
        }
      />
      <section className="fg-statistics" aria-label="今日统计">
        {statistics.map(({ title, unit, icon: Icon, color }) => (
          <article className="fg-card fg-statistic" key={title}>
            <span className={`fg-stat-art ${color}`}>
              <Icon size={32} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <h2>{title}</h2>
              <p>
                <strong aria-label="暂无统计">—</strong>
                <span>{unit}</span>
              </p>
            </div>
            <span className="fg-stat-caption">统计即将开放</span>
          </article>
        ))}
      </section>
      <div className="fg-home-grid">
        <section className="fg-card fg-tasks-panel">
          <div className="fg-section-heading">
            <div>
              <h2>
                <ListTodo size={21} aria-hidden="true" />
                我的任务
              </h2>
              <p>一次一件事，让想法慢慢发芽。</p>
            </div>
            <span className="fg-soft-label">等待新的计划</span>
          </div>
          <div className="fg-task-empty">
            <span className="fg-empty-illustration">
              <PencilLine size={36} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <h3>从一件小事开始</h3>
            <p>
              未来，你的任务会在这里生根发芽。
              <br />
              先为重要的事，留一个位置。
            </p>
            <Button variant="outline" disabled>
              <Plus size={16} aria-hidden="true" />
              创建第一个任务
            </Button>
            <span className="fg-unavailable-note">
              任务创建将在下一阶段接入
            </span>
          </div>
          <ol className="fg-onboarding">
            <li>
              <PencilLine size={17} aria-hidden="true" />
              <span>创建任务</span>
            </li>
            <li>
              <Play size={17} aria-hidden="true" />
              <span>开始专注</span>
            </li>
            <li>
              <Flower2 size={17} aria-hidden="true" />
              <span>收获植物</span>
            </li>
          </ol>
        </section>
        <section className="fg-card fg-garden-panel">
          <div className="fg-section-heading">
            <div>
              <h2>
                <Sprout size={21} aria-hidden="true" />
                我的专注花园
              </h2>
              <p>种下一份专注，静待美好发生。</p>
            </div>
          </div>
          <GardenScene />
          <div className="fg-garden-bottom">
            <span>花园已准备好，等待第一颗种子。</span>
            <Button asChild variant="outline" size="sm">
              <Link to="/collection">
                植物收藏
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
      <p className="fg-page-quote">
        不必一下子变得很厉害，每天生长一点点就好。
      </p>
    </>
  );
};
