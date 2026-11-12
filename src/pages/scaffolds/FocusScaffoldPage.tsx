import { Pause, Square, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/PageHeading";
import { SeedlingPreview } from "@/components/garden/SeedlingPreview";
import { GardenScene } from "@/components/garden/GardenScene";
export const FocusScaffoldPage = () => (
  <>
    <PageHeading
      title="留一段时间，给专注"
      description="每一分钟，都在悄悄生长。"
      eyebrow="ONE THING AT A TIME"
    />
    <div className="fg-focus-grid">
      <section className="fg-card fg-focus-landscape">
        <div className="fg-section-heading">
          <h2>
            <Sprout size={21} aria-hidden="true" />
            植物生长区域
          </h2>
          <span className="fg-soft-label">等待开始</span>
        </div>
        <GardenScene />
      </section>
      <section
        className="fg-card fg-focus-session"
        aria-label="专注内容预留区域"
      >
        <span className="fg-soft-label">尚未关联专注记录</span>
        <h2>任务标题预留区域</h2>
        <p>选择任务后，在这里开启一段专注。</p>
        <div className="fg-timer-preview">
          <SeedlingPreview />
          <strong aria-label="倒计时占位，尚未开始">--:--</strong>
          <span>倒计时区域</span>
        </div>
        <div className="fg-focus-actions">
          <Button disabled>
            <Pause size={17} aria-hidden="true" />
            暂停
          </Button>
          <Button disabled variant="outline">
            <Square size={16} aria-hidden="true" />
            结束本轮
          </Button>
        </div>
        <p className="fg-placeholder-hint">专注流程将在后续阶段接入</p>
      </section>
    </div>
  </>
);
