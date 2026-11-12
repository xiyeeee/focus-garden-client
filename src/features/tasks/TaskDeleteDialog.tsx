import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { taskApi } from "@/services/tasks/api";
import { ApiError, errorMessage } from "@/services/http";
import { taskKeys } from "./queries";
import type { TaskRecord } from "./task-model";
export const TaskDeleteDialog = ({
  task,
  onClose,
  onDeleted,
}: {
  task: TaskRecord;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const remove = useMutation({
    mutationFn: () => taskApi.delete(task.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(task.id) });
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404) {
        queryClient.removeQueries({ queryKey: taskKeys.detail(task.id) });
        void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      }
    },
  });
  const close = () => {
    if (!submitting.current) onClose();
  };
  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await remove.mutateAsync();
      onDeleted();
      onClose();
    } catch {
      /* 错误保留在确认弹窗中。 */
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除这个任务？</DialogTitle>
          <DialogDescription>
            删除后，任务将从列表中移除。已有专注记录与收获植物会保留。
          </DialogDescription>
        </DialogHeader>
        <p className="fg-task-delete-name">{task.title}</p>
        {remove.error && (
          <p role="alert" className="fg-task-error">
            {errorMessage(remove.error)}
          </p>
        )}
        <div className="fg-task-editor-footer">
          <Button variant="outline" disabled={remove.isPending} onClick={close}>
            取消
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => void submit()}
          >
            <Trash2 size={16} />
            {remove.isPending ? "删除中…" : "确认删除"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
