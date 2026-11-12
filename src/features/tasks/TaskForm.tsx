import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlantArt } from "@/features/garden/PlantArt";
import { plantTypes, plantCatalog } from "@/features/garden/catalog";
import { useGarden } from "@/hooks/useGarden";
import { gardenService } from "@/services";
import type { Task, PlantType } from "@/types";
export const TaskForm = ({
  task,
  onClose,
}: {
  task?: Task;
  onClose: () => void;
}) => {
  const { data, busy, run, error: serviceError } = useGarden();
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [duration, setDuration] = useState(
    String(task?.plannedMinutes ?? data!.settings.focusMinutes),
  );
  const [plant, setPlant] = useState<PlantType>(task?.plantType ?? "fern");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("给这件事起一个名字吧");
      return;
    }
    const result = await run(() =>
      gardenService.saveTask(
        { title, notes, plannedMinutes: Number(duration), plantType: plant },
        task?.id,
      ),
    );
    if (result) onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "编辑任务" : "种下一份小小的计划"}</DialogTitle>
          <DialogDescription>
            选一件想完成的事，让专注陪它慢慢生长。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="task-form">
          <label htmlFor="task-title">
            任务名称 <span>*</span>
          </label>
          <Input
            id="task-title"
            autoFocus
            maxLength={100}
            placeholder="你想专注做些什么？"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
            required
          />
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <label htmlFor="task-notes">
            备注 <small>选填</small>
          </label>
          <Textarea
            id="task-notes"
            maxLength={1000}
            placeholder="写下一点思路，让开始更简单…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <label htmlFor="task-duration">计划专注时长 · 分钟</label>
          <div className="duration-options">
            {[15, 25, 45, 60].map((value) => (
              <Button
                type="button"
                variant={Number(duration) === value ? "default" : "outline"}
                key={value}
                onClick={() => setDuration(String(value))}
              >
                {value} 分钟
              </Button>
            ))}
          </div>
          <Input
            id="task-duration"
            type="number"
            min={1}
            max={180}
            step={1}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            required
          />
          <small>支持 1–180 分钟。完成一轮后，仍可继续专注。</small>
          <label>选择你的植物</label>
          <div className="plant-picker">
            {plantTypes.map((type) => (
              <button
                type="button"
                aria-pressed={plant === type}
                className={plant === type ? "selected" : ""}
                onClick={() => setPlant(type)}
                key={type}
              >
                <PlantArt type={type} />
                <span>{plantCatalog[type].name}</span>
              </button>
            ))}
          </div>
          {serviceError && (
            <p role="alert" className="field-error">
              {serviceError}
            </p>
          )}
          <div className="dialog-actions">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              取消
            </Button>
            <Button disabled={busy} type="submit">
              {busy ? "保存中…" : task ? "保存修改" : "种下新任务"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
