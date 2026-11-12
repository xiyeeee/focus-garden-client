export type PlantType = "fern" | "daisy" | "cactus" | "tulip";
export interface Task {
  id: string;
  title: string;
  notes: string;
  plannedMinutes: number;
  plantType: PlantType;
  status: "pending" | "completed";
  createdAt: number;
  completedAt: number | null;
}
export type TaskInput = Pick<
  Task,
  "title" | "notes" | "plannedMinutes" | "plantType"
>;
export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  plantType: PlantType;
  plannedMinutes: number;
  actualMs: number;
  status: "running" | "paused" | "completed" | "abandoned";
  startedAt: number;
  endedAt: number | null;
  resumedAt: number | null;
  breakEndsAt: number | null;
}
export interface Plant {
  id: string;
  type: PlantType;
  sessionId: string;
  obtainedAt: number;
}
export interface UserSettings {
  focusMinutes: number;
  breakMinutes: number;
  soundEnabled: boolean;
}
export interface GardenData {
  version: 1;
  tasks: Task[];
  sessions: FocusSession[];
  plants: Plant[];
  settings: UserSettings;
}
export type SessionAction =
  "pause" | "resume" | "abandon" | "complete" | "break" | "skipBreak";
export interface GardenService {
  read: () => Promise<GardenData>;
  saveTask: (input: TaskInput, id?: string) => Promise<GardenData>;
  deleteTask: (id: string) => Promise<GardenData>;
  completeTask: (id: string) => Promise<GardenData>;
  start: (taskId: string) => Promise<FocusSession>;
  sessionAction: (id: string, action: SessionAction) => Promise<GardenData>;
  saveSettings: (settings: UserSettings) => Promise<GardenData>;
}
