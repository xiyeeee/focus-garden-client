import {
  Check,
  Clock3,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { plantCatalog } from "@/features/garden/catalog";
import { taskStatusLabels, type TaskRecord } from "./task-model";
export const TaskRow = ({
  task,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: TaskRecord;
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <article
    className={`fg-remote-task-row ${task.status === "COMPLETED" ? "is-completed" : ""}`}
  >
    <button
      className="fg-task-complete-check"
      type="button"
      role="checkbox"
      aria-checked={task.status === "COMPLETED"}
      aria-label={`${task.status === "COMPLETED" ? "重新打开" : "完成任务"}：${task.title}`}
      disabled={busy}
      onClick={onToggle}
    >
      {task.status === "COMPLETED" && <Check size={17} aria-hidden="true" />}
    </button>
    <div className="fg-remote-task-body">
      <h3>{task.title}</h3>
      {task.notes && <p>{task.notes}</p>}
      <div className="fg-remote-task-meta">
        <span>
          <Clock3 size={13} aria-hidden="true" />
          {task.plannedMinutes} 分钟
        </span>
        <span>
          <Sprout size={13} aria-hidden="true" />
          {plantCatalog[task.plantType].name}
        </span>
        <span className={`fg-task-status ${task.status}`}>
          {taskStatusLabels[task.status]}
        </span>
      </div>
    </div>
    <div className="fg-remote-task-actions">
      <Button variant="outline" size="sm" disabled title="专注接口尚未开放">
        <Play size={14} aria-hidden="true" />
        专注待开放
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            aria-label={`更多操作：${task.title}`}
          >
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil size={15} />
            编辑任务
          </DropdownMenuItem>
          <DropdownMenuItem
            className="fg-dropdown-destructive"
            onSelect={onDelete}
          >
            <Trash2 size={15} />
            删除任务
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </article>
);
