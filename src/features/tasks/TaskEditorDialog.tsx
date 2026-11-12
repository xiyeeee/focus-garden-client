import { useState, useRef, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sprout, LoaderCircle } from "lucide-react";
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
import { plantCatalog, plantTypes } from "@/features/garden/catalog";
import { taskApi } from "@/services/tasks/api";
import { ApiError, errorMessage } from "@/services/http";
import { taskKeys } from "./queries";
import {
  taskStatusLabels,
  type TaskDraft,
  type TaskRecord,
} from "./task-model";

const TaskEditorForm = ({
  task,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  task?: TaskRecord;
  busy: boolean;
  error: string;
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
}) => {
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [duration, setDuration] = useState(String(task?.plannedMinutes ?? 25));
  const [plant, setPlant] = useState<TaskDraft["plantType"]>(
    task?.plantType ?? "fern",
  );
  const [fieldError, setFieldError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || title.length > 100) {
      setFieldError(
        "请输入去除首尾空白后非空、原始长度不超过 100 字的任务名称。",
      );
      return;
    }
    if (
      !Number.isInteger(Number(duration)) ||
      Number(duration) < 1 ||
      Number(duration) > 1440
    ) {
      setFieldError("请输入 1–1440 的整数分钟。");
      return;
    }
    if (notes.length > 2000) {
      setFieldError("备注不能超过 2000 字。");
      return;
    }
    setFieldError("");
    onSubmit({
      title,
      notes,
      plannedMinutes: Number(duration),
      plantType: plant,
    });
  };
  return (
    <form className="fg-task-editor-form" noValidate onSubmit={submit}>
      <fieldset disabled={busy} className="fg-task-editor-fields">
        <div className="fg-task-editor-grid">
          <div className="fg-task-editor-inputs">
            <label htmlFor="remote-task-title">
              任务名称 <span aria-hidden="true">*</span>
            </label>
            <Input
              id="remote-task-title"
              maxLength={100}
              autoFocus
              value={title}
              placeholder="你想专注做些什么？"
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldError("");
              }}
              required
            />
            <label htmlFor="remote-task-notes">
              备注 <small>选填</small>
            </label>
            <Textarea
              id="remote-task-notes"
              maxLength={2000}
              value={notes}
              placeholder="写下一点思路，让开始更简单…"
              onChange={(event) => setNotes(event.target.value)}
            />
            <label htmlFor="remote-task-duration">计划专注时长（分钟）</label>
            <div className="fg-task-duration-options">
              {[25, 45, 60].map((value) => (
                <Button
                  type="button"
                  key={value}
                  variant={Number(duration) === value ? "default" : "outline"}
                  onClick={() => setDuration(String(value))}
                >
                  {value} 分钟
                </Button>
              ))}
            </div>
            <Input
              id="remote-task-duration"
              type="number"
              min={1}
              max={1440}
              step={1}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
            <small className="fg-task-field-hint">
              支持 1–1440 分钟；仅保存计划，不会开始计时。
            </small>
            <span className="fg-task-field-label">关联植物</span>
            <div className="fg-task-plant-picker">
              {plantTypes.map((type) => (
                <button
                  type="button"
                  aria-pressed={type === plant}
                  key={type}
                  onClick={() => setPlant(type)}
                >
                  <PlantArt type={type} />
                  <span>{plantCatalog[type].name}</span>
                </button>
              ))}
            </div>
          </div>
          <aside className="fg-task-plant-preview">
            <span>
              <Sprout size={16} />
              这次想种下什么？
            </span>
            <PlantArt type={plant} />
            <h3>{plantCatalog[plant].name}</h3>
            <p>{plantCatalog[plant].description}</p>
            <small>
              植物类型仅作为任务偏好；
              <br />
              保存任务不会获得植物。
            </small>
            {task && (
              <span className="fg-soft-label">
                {taskStatusLabels[task.status]} · 编辑保留当前状态
              </span>
            )}
          </aside>
        </div>
      </fieldset>
      {fieldError && (
        <p className="fg-task-error" role="alert">
          {fieldError}
        </p>
      )}
      {error && (
        <p className="fg-task-error" role="alert">
          {error}
        </p>
      )}
      <div className="fg-task-editor-footer">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          取消
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <LoaderCircle size={16} className="animate-spin" />}
          {busy ? "保存中…" : task ? "保存修改" : "创建任务"}
        </Button>
      </div>
    </form>
  );
};

export const TaskEditorDialog = ({
  taskId,
  onClose,
  onSaved,
}: {
  taskId?: string;
  onClose: () => void;
  onSaved: (created: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const detail = useQuery({
    queryKey: taskKeys.detail(taskId ?? ""),
    queryFn: async ({ signal }) => {
      try {
        return await taskApi.get(taskId!, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404)
          void queryClient.invalidateQueries({ queryKey: taskKeys.lists });
        throw error;
      }
    },
    enabled: !!taskId,
    retry: false,
    staleTime: 0,
  });
  const save = useMutation({
    mutationFn: (draft: TaskDraft) =>
      taskId ? taskApi.update(detail.data!, draft) : taskApi.create(draft),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.lists });
      }
    },
  });
  const close = () => {
    if (!submitting.current) onClose();
  };
  const submit = async (draft: TaskDraft) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await save.mutateAsync(draft);
      onSaved(!taskId);
      onClose();
    } catch {
      /* mutation.error 显示具体错误，保留用户输入；POST 不自动重试。 */
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="fg-task-editor-dialog"
        onInteractOutside={(event) => {
          if (save.isPending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (save.isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <Sprout size={23} aria-hidden="true" />
            {taskId ? "编辑任务" : "新建任务"}
          </DialogTitle>
          <DialogDescription>
            {taskId
              ? "修改仅影响后续计划，历史记录保持不变。"
              : "种下一份小计划，为这件事留一段时间。"}
          </DialogDescription>
        </DialogHeader>
        {taskId && detail.isPending ? (
          <div className="fg-task-loading" role="status">
            <LoaderCircle className="animate-spin" size={20} />
            正在读取最新任务…
          </div>
        ) : taskId && detail.isError ? (
          <div className="fg-task-detail-error">
            <p role="alert">{errorMessage(detail.error)}</p>
            <Button variant="outline" onClick={() => void detail.refetch()}>
              重新读取
            </Button>
          </div>
        ) : (
          <TaskEditorForm
            task={taskId ? detail.data : undefined}
            busy={save.isPending}
            error={
              save.error
                ? `${errorMessage(save.error)}${save.error instanceof ApiError && save.error.status === null ? " 请先关闭弹窗并刷新列表，核对保存结果，避免重复创建。" : ""}`
                : ""
            }
            onSubmit={(draft) => void submit(draft)}
            onCancel={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
