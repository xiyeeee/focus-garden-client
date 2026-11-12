import type { GardenData, GardenService } from "@/types";
import { readStorage, writeStorage } from "./storage";
import { elapsedMs, isActive, settleSessions } from "@/features/focus/timer";
import { plantTypes } from "@/features/garden/catalog";
const transaction = async <T>(
  operation: (data: GardenData) => T,
): Promise<T> => {
  const run = () => {
    const data = settleSessions(readStorage());
    const result = operation(data);
    writeStorage(data);
    return result;
  };
  // Web Locks serializes mutations across browser tabs; each operation itself is synchronous.
  if (navigator.locks)
    return navigator.locks.request("focus-garden-write", run);
  return run();
};
export const mockService: GardenService = {
  read: () => transaction((data) => data),
  saveTask: (input, id) =>
    transaction((data) => {
      const title = input.title.trim();
      if (!title || title.length > 100)
        throw new Error("请输入 1–100 字的任务标题");
      if (
        !Number.isInteger(input.plannedMinutes) ||
        input.plannedMinutes < 1 ||
        input.plannedMinutes > 180 ||
        !plantTypes.includes(input.plantType)
      )
        throw new Error("请检查专注时长与植物类型");
      const values = { ...input, title, notes: input.notes.trim() };
      if (id) {
        const task = data.tasks.find((task) => task.id === id);
        if (!task) throw new Error("任务不存在");
        Object.assign(task, values);
      } else
        data.tasks.unshift({
          ...values,
          id: crypto.randomUUID(),
          status: "pending",
          createdAt: Date.now(),
          completedAt: null,
        });
      return data;
    }),
  deleteTask: (id) =>
    transaction((data) => {
      if (
        data.sessions.some(
          (session) => session.taskId === id && isActive(session),
        )
      )
        throw new Error(
          "此任务正在专注，请先返回专注页完成或放弃本轮，再删除任务。",
        );
      data.tasks = data.tasks.filter((task) => task.id !== id);
      return data;
    }),
  completeTask: (id) =>
    transaction((data) => {
      if (
        data.sessions.some(
          (session) => session.taskId === id && isActive(session),
        )
      )
        throw new Error("请先完成或放弃当前专注，再完成任务");
      const task = data.tasks.find((task) => task.id === id);
      if (!task) throw new Error("任务不存在");
      task.status = "completed";
      task.completedAt ??= Date.now();
      return data;
    }),
  start: (taskId) =>
    transaction((data) => {
      const active = data.sessions.find(isActive);
      if (active) return active;
      const task = data.tasks.find((task) => task.id === taskId);
      if (!task || task.status === "completed")
        throw new Error("任务不存在或已完成");
      const now = Date.now();
      const session = {
        id: crypto.randomUUID(),
        taskId,
        taskTitle: task.title,
        plantType: task.plantType,
        plannedMinutes: task.plannedMinutes,
        actualMs: 0,
        status: "running" as const,
        startedAt: now,
        endedAt: null,
        resumedAt: now,
        breakEndsAt: null,
      };
      data.sessions.unshift(session);
      return session;
    }),
  sessionAction: (id, action) =>
    transaction((data) => {
      const session = data.sessions.find((session) => session.id === id);
      if (!session) throw new Error("专注记录不存在");
      const now = Date.now();
      if (action === "pause" && session.status === "running") {
        session.actualMs = elapsedMs(session, now);
        session.resumedAt = null;
        session.status = "paused";
      }
      if (action === "resume" && session.status === "paused") {
        session.resumedAt = now;
        session.status = "running";
      }
      if (action === "abandon" && isActive(session)) {
        session.actualMs = elapsedMs(session, now);
        session.resumedAt = null;
        session.status = "abandoned";
        session.endedAt = now;
      }
      if (
        action === "break" &&
        session.status === "completed" &&
        session.breakEndsAt === null
      )
        session.breakEndsAt = now + data.settings.breakMinutes * 60000;
      if (action === "skipBreak" && session.breakEndsAt !== null)
        session.breakEndsAt = now;
      return data;
    }),
  saveSettings: (settings) =>
    transaction((data) => {
      if (
        !Number.isInteger(settings.focusMinutes) ||
        settings.focusMinutes < 1 ||
        settings.focusMinutes > 180 ||
        !Number.isInteger(settings.breakMinutes) ||
        settings.breakMinutes < 1 ||
        settings.breakMinutes > 60
      )
        throw new Error("专注时长范围 1–180 分钟，休息时长范围 1–60 分钟");
      data.settings = settings;
      return data;
    }),
};
