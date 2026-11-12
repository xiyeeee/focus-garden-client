import type { TaskStatus, TaskPlantType } from "@/services/tasks/types";
export interface TaskRecord {
  id: string;
  title: string;
  notes: string;
  plannedMinutes: number;
  plantType: TaskPlantType;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}
export type TaskDraft = Pick<
  TaskRecord,
  "title" | "notes" | "plannedMinutes" | "plantType"
>;
export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "待开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
};
