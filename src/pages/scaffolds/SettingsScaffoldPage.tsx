import { Clock3, Coffee, Volume2, Sun, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeading } from "@/components/layout/PageHeading";
import { PlaceholderPanel } from "@/components/layout/PlaceholderPanel";
export const SettingsScaffoldPage = () => (
  <>
    <PageHeading
      title="设置"
      description="调整到让你舒服的节奏，按自己的步调慢慢来。"
      eyebrow="MAKE YOURSELF AT HOME"
    />
    <div className="fg-settings-grid">
      <PlaceholderPanel
        title="专注与休息"
        description="给专注留出空间，也给自己一点休息。"
        icon={Clock3}
      >
        <fieldset disabled className="fg-settings-fields">
          <legend className="sr-only">
            专注与休息默认值预览，设置功能尚未开放
          </legend>
          <label htmlFor="default-focus">
            <span>
              <Clock3 size={17} aria-hidden="true" />
              默认专注时长
            </span>
            <span className="fg-input-unit">
              <Input id="default-focus" type="number" value={25} readOnly />
              <span>分钟</span>
            </span>
          </label>
          <label htmlFor="default-break">
            <span>
              <Coffee size={17} aria-hidden="true" />
              短休息时长
            </span>
            <span className="fg-input-unit">
              <Input id="default-break" type="number" value={5} readOnly />
              <span>分钟</span>
            </span>
          </label>
        </fieldset>
        <p className="fg-placeholder-hint">
          以上为默认值预览，设置功能即将开放。
        </p>
      </PlaceholderPanel>
      <div className="fg-settings-stack">
        <PlaceholderPanel
          title="声音与提醒"
          description="让每一次投入和休息，都有温柔的回应。"
          icon={Volume2}
        >
          <div className="fg-setting-preview-row">
            <label htmlFor="completion-sound">完成提示音</label>
            <Switch
              id="completion-sound"
              checked={false}
              disabled
              aria-describedby="sound-coming-soon"
            />
          </div>
          <p className="fg-placeholder-hint" id="sound-coming-soon">
            声音设置即将开放
          </p>
        </PlaceholderPanel>
        <PlaceholderPanel
          title="外观"
          description="暖白与绿意，是花园现在的颜色。"
          icon={Sun}
        >
          <div className="fg-appearance-preview">
            <Sun size={19} aria-hidden="true" />
            <span>明亮模式</span>
            <span>当前外观</span>
          </div>
        </PlaceholderPanel>
      </div>
    </div>
    <div className="fg-settings-save">
      <span>偏好保存将在后续阶段接入</span>
      <Button disabled>
        <Save size={17} aria-hidden="true" />
        保存设置
      </Button>
    </div>
  </>
);
