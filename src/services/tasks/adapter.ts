import type { TaskDraft, TaskRecord } from "@/features/tasks/task-model";
import type { TaskCreateDTO, TaskUpdateDTO, TaskVO } from "./types";
import { ApiError } from "@/services/http";
const timestamp = (value: string) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed))
    throw new ApiError(
      "任务时间格式不正确，请检查后端响应。",
      null,
      "INVALID_RESPONSE",
    );
  return parsed;
};
export const toTaskRecord = (task: TaskVO): TaskRecord => {
  if (
    !task ||
    typeof task.id !== "string" ||
    !/^[1-9]\d*$/.test(task.id) ||
    !["TODO", "IN_PROGRESS", "COMPLETED"].includes(task.status) ||
    !["fern", "daisy", "cactus", "tulip"].includes(task.plantType) ||
    typeof task.title !== "string" ||
    typeof task.description !== "string" ||
    !Number.isInteger(task.plannedFocusMinutes) ||
    task.plannedFocusMinutes < 1 ||
    task.plannedFocusMinutes > 1440
  )
    throw new ApiError(
      "任务响应格式不正确，请检查后端接口契约。",
      null,
      "INVALID_RESPONSE",
    );
  return {
    id: task.id,
    title: task.title,
    notes: task.description,
    plannedMinutes: task.plannedFocusMinutes,
    plantType: task.plantType,
    status: task.status,
    createdAt: timestamp(task.createdAt),
    updatedAt: timestamp(task.updatedAt),
    completedAt: task.completedAt === null ? null : timestamp(task.completedAt),
  };
};
export const toTaskCreateDTO = (draft: TaskDraft): TaskCreateDTO => ({
  title: draft.title.trim(),
  description: draft.notes,
  plannedFocusMinutes: draft.plannedMinutes,
  plantType: draft.plantType,
  status: "TODO",
});
export const toTaskUpdateDTO = (
  draft: TaskDraft,
  original: TaskRecord,
): TaskUpdateDTO => ({ ...toTaskCreateDTO(draft), status: original.status });
