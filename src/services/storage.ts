import type { GardenData } from "@/types";
export const STORAGE_KEY = "focus-garden:v1";
export const initialData = (): GardenData => ({
  version: 1,
  tasks: [],
  sessions: [],
  plants: [],
  settings: { focusMinutes: 25, breakMinutes: 5, soundEnabled: false },
});
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);
const validPlant = (value: unknown) =>
  ["fern", "daisy", "cactus", "tulip"].includes(String(value));
const validData = (value: unknown): value is GardenData => {
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.sessions) ||
    !Array.isArray(value.plants) ||
    !isObject(value.settings)
  )
    return false;
  return (
    value.tasks.every(
      (task) =>
        isObject(task) &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.notes === "string" &&
        finite(task.plannedMinutes) &&
        Number(task.plannedMinutes) >= 1 &&
        validPlant(task.plantType) &&
        ["pending", "completed"].includes(String(task.status)) &&
        finite(task.createdAt),
    ) &&
    value.sessions.every(
      (session) =>
        isObject(session) &&
        typeof session.id === "string" &&
        typeof session.taskId === "string" &&
        typeof session.taskTitle === "string" &&
        validPlant(session.plantType) &&
        finite(session.plannedMinutes) &&
        Number(session.plannedMinutes) >= 1 &&
        finite(session.actualMs) &&
        finite(session.startedAt) &&
        (session.resumedAt === null || finite(session.resumedAt)) &&
        (session.endedAt === null || finite(session.endedAt)) &&
        (session.breakEndsAt === null || finite(session.breakEndsAt)) &&
        ["running", "paused", "completed", "abandoned"].includes(
          String(session.status),
        ),
    ) &&
    value.plants.every(
      (plant) =>
        isObject(plant) &&
        typeof plant.id === "string" &&
        typeof plant.sessionId === "string" &&
        validPlant(plant.type) &&
        finite(plant.obtainedAt),
    ) &&
    finite(value.settings.focusMinutes) &&
    Number(value.settings.focusMinutes) >= 1 &&
    Number(value.settings.focusMinutes) <= 180 &&
    finite(value.settings.breakMinutes) &&
    Number(value.settings.breakMinutes) >= 1 &&
    Number(value.settings.breakMinutes) <= 60 &&
    typeof value.settings.soundEnabled === "boolean"
  );
};
export const readStorage = (): GardenData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialData();
    const value: unknown = JSON.parse(raw);
    if (!validData(value)) throw new Error();
    return value;
  } catch {
    throw new Error(
      "无法读取本地数据。请检查浏览器存储权限；若数据损坏，请先备份后处理，原数据未被覆盖。",
    );
  }
};
export const writeStorage = (data: GardenData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    throw new Error("保存失败，请检查存储权限或剩余空间。此次修改未保存。");
  }
};
