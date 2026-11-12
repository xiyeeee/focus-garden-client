import {
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  History,
  Sprout,
} from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";
export const RecordsScaffoldPage = () => (
  <>
    <PageHeading
      title="成长记录"
      description="每一份专注，都有回响。留住那些认真度过的时光。"
      eyebrow="YOUR GROWTH JOURNAL"
    />
    <div className="fg-records-summary">
      {[
        { label: "专注时长", icon: Clock3 },
        { label: "完成任务", icon: CalendarDays },
        { label: "收获植物", icon: Sprout },
      ].map(({ label, icon: Icon }) => (
        <section className="fg-card fg-summary-item" key={label}>
          <Icon size={24} aria-hidden="true" />
          <div>
            <h2>{label}</h2>
            <span>—</span>
          </div>
          <p>统计即将开放</p>
        </section>
      ))}
    </div>
    <div className="fg-records-grid">
      <PlaceholderPanel
        title="每周专注"
        description="让每一段认真投入的时光，汇成一周的风景。"
        icon={ChartNoAxesCombined}
      >
        <div
          className="fg-chart-placeholder"
          aria-label="每周专注图表占位，暂无统计"
        >
          <span>你的成长曲线，将从这里开始。</span>
          <div className="fg-chart-baseline" />
        </div>
      </PlaceholderPanel>
      <PlaceholderPanel
        title="专注日历"
        description="为专注过的日子，留一个小小的印记。"
        icon={CalendarDays}
      >
        <div className="fg-calendar-placeholder" aria-label="日历区域占位">
          {Array.from({ length: 28 }, (_, index) => (
            <span aria-hidden="true" key={index} />
          ))}
        </div>
        <p className="fg-placeholder-hint">日期查询即将开放</p>
      </PlaceholderPanel>
    </div>
    <PlaceholderPanel
      title="专注足迹"
      description="任务名称、专注时长与完成状态将在这里展示。"
      icon={History}
    >
      <div className="fg-inline-empty">
        <History size={26} aria-hidden="true" />
        <p>记录列表即将开放，每一份努力都会被认真保存。</p>
      </div>
    </PlaceholderPanel>
  </>
);
