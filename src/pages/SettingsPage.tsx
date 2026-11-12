import { useState, type FormEvent } from "react";
import { Volume2, Save, SlidersHorizontal } from "lucide-react";
import { useGarden } from "@/hooks/useGarden";
import { gardenService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { prepareSound, playSound } from "@/features/focus/sound";
import type { UserSettings } from "@/types";
const SettingsForm = ({ settings }: { settings: UserSettings }) => {
  const { run, busy } = useGarden();
  const [focus, setFocus] = useState(String(settings.focusMinutes));
  const [rest, setRest] = useState(String(settings.breakMinutes));
  const [sound, setSound] = useState(settings.soundEnabled);
  const [message, setMessage] = useState("");
  const testSound = async () => {
    try {
      await prepareSound();
      await playSound();
      setMessage("提示音已启用。刷新页面后可能需要再次点击测试。");
    } catch {
      setMessage("浏览器未能播放提示音，请检查声音权限和设备音量。");
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() =>
      gardenService.saveSettings({
        focusMinutes: Number(focus),
        breakMinutes: Number(rest),
        soundEnabled: sound,
      }),
    );
    if (result) setMessage("偏好已保存，新建任务将使用新的默认时长。");
  };
  return (
    <form className="settings-panel" onSubmit={(event) => void save(event)}>
      <div className="settings-title">
        <SlidersHorizontal size={20} />
        <h2>找到你的专注节奏</h2>
      </div>
      <div className="setting-row">
        <div>
          <label htmlFor="focus-default">默认专注时长</label>
          <p>用于新建任务，已有任务和进行中的专注不受影响。</p>
        </div>
        <div className="number-unit">
          <Input
            id="focus-default"
            type="number"
            min={1}
            max={180}
            required
            step={1}
            value={focus}
            onChange={(event) => {
              setFocus(event.target.value);
              setMessage("");
            }}
          />
          <span>分钟</span>
        </div>
      </div>
      <div className="setting-row">
        <div>
          <label htmlFor="rest-default">默认休息时长</label>
          <p>休息让下一轮专注更从容，支持 1–60 分钟。</p>
        </div>
        <div className="number-unit">
          <Input
            id="rest-default"
            type="number"
            min={1}
            max={60}
            required
            step={1}
            value={rest}
            onChange={(event) => {
              setRest(event.target.value);
              setMessage("");
            }}
          />
          <span>分钟</span>
        </div>
      </div>
      <div className="setting-row">
        <div>
          <label htmlFor="sound-setting">温柔的结束提示音</label>
          <p>专注或休息结束时播放，浏览器可能要求先点击测试。</p>
        </div>
        <Switch
          id="sound-setting"
          checked={sound}
          onCheckedChange={(value) => {
            setSound(value);
            setMessage("");
            if (value) void testSound();
          }}
        />
      </div>
      <div className="settings-bottom">
        <Button
          type="button"
          variant="outline"
          onClick={() => void testSound()}
        >
          <Volume2 size={16} />
          测试提示音
        </Button>
        <Button type="submit" disabled={busy}>
          <Save size={16} />
          {busy ? "保存中…" : "保存偏好"}
        </Button>
      </div>
      {message && (
        <p className="save-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
};
export const SettingsPage = () => {
  const { data } = useGarden();
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">MAKE YOURSELF AT HOME</div>
          <h1>按自己的节奏，慢慢来。</h1>
          <p>为自己留一个舒服的专注空间。</p>
        </div>
      </section>
      {data && <SettingsForm settings={data.settings} />}
      <div className="storage-note">
        <h3>你的小花园，保存在这里</h3>
        <p>
          当前使用本机浏览器存储，刷新后仍会保留。清除站点数据会移除任务、记录、植物与设置；暂不提供账号同步。
        </p>
      </div>
    </>
  );
};
