import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { mockService as service } from "./mock";
import { STORAGE_KEY } from "./storage";
const createTask = async () => {
  const data = await service.saveTask({
    title: "  阅读一本书  ",
    notes: "一章就好",
    plannedMinutes: 1,
    plantType: "daisy",
  });
  return data.tasks[0];
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T08:00:00+08:00"));
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  vi.stubGlobal("navigator", {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("异步持久化业务契约", () => {
  it("创建时去空格，支持编辑、完成和删除", async () => {
    const task = await createTask();
    expect(task.title).toBe("阅读一本书");
    await service.saveTask({ ...task, title: "修改后的任务" }, task.id);
    expect((await service.read()).tasks[0].title).toBe("修改后的任务");
    await service.completeTask(task.id);
    expect((await service.read()).tasks[0].status).toBe("completed");
    await service.deleteTask(task.id);
    expect((await service.read()).tasks).toHaveLength(0);
  });
  it("拦截空白标题、非法时长", async () => {
    const task = await createTask();
    await expect(service.saveTask({ ...task, title: "  " })).rejects.toThrow();
    await expect(
      service.saveTask({ ...task, plannedMinutes: 0 }),
    ).rejects.toThrow();
    await expect(
      service.saveTask({ ...task, plannedMinutes: 181 }),
    ).rejects.toThrow();
  });
  it("同一时间只返回已有活跃记录，并拦截活跃任务删除与完成", async () => {
    const task = await createTask();
    const first = await service.start(task.id);
    const anotherTask = await createTask();
    expect((await service.start(anotherTask.id)).id).toBe(first.id);
    await expect(service.deleteTask(task.id)).rejects.toThrow("正在专注");
    await expect(service.completeTask(task.id)).rejects.toThrow();
    expect((await service.read()).sessions).toHaveLength(1);
  });
  it("暂停后刷新不累计，恢复后按剩余时长完成", async () => {
    const task = await createTask();
    const session = await service.start(task.id);
    vi.setSystemTime(Date.now() + 20000);
    await service.sessionAction(session.id, "pause");
    vi.setSystemTime(Date.now() + 3600000);
    let data = await service.read();
    expect(data.sessions[0].actualMs).toBe(20000);
    expect(data.sessions[0].status).toBe("paused");
    await service.sessionAction(session.id, "resume");
    vi.setSystemTime(Date.now() + 40000);
    data = await service.read();
    expect(data.sessions[0].status).toBe("completed");
    expect(data.sessions[0].actualMs).toBe(60000);
    expect(data.plants).toHaveLength(1);
  });
  it("刷新结算、重复完成和继续多轮都不会重复奖励或自动完成任务", async () => {
    const task = await createTask();
    const first = await service.start(task.id);
    vi.setSystemTime(Date.now() + 90000);
    await service.read();
    await service.sessionAction(first.id, "complete");
    let data = await service.read();
    expect(data.plants).toHaveLength(1);
    expect(data.tasks[0].status).toBe("pending");
    const second = await service.start(task.id);
    expect(second.id).not.toBe(first.id);
    vi.setSystemTime(Date.now() + 60000);
    data = await service.read();
    expect(data.plants).toHaveLength(2);
    expect(data.sessions).toHaveLength(2);
  });
  it("放弃保留实际时间，不发植物，历史在删除任务后仍保留", async () => {
    const task = await createTask();
    const session = await service.start(task.id);
    vi.setSystemTime(Date.now() + 15000);
    await service.sessionAction(session.id, "abandon");
    vi.setSystemTime(Date.now() + 999999);
    await service.sessionAction(session.id, "complete");
    await service.deleteTask(task.id);
    const data = await service.read();
    expect(data.sessions[0].status).toBe("abandoned");
    expect(data.sessions[0].actualMs).toBe(15000);
    expect(data.sessions[0].taskTitle).toBe(task.title);
    expect(data.plants).toHaveLength(0);
  });
  it("修改设置持久化，已有专注和已经开始的休息不受影响", async () => {
    const task = await createTask();
    const session = await service.start(task.id);
    await service.saveSettings({
      focusMinutes: 45,
      breakMinutes: 1,
      soundEnabled: true,
    });
    expect((await service.read()).sessions[0].plannedMinutes).toBe(1);
    vi.setSystemTime(Date.now() + 60000);
    const data = await service.sessionAction(session.id, "break");
    const end = data.sessions[0].breakEndsAt;
    await service.saveSettings({
      focusMinutes: 30,
      breakMinutes: 10,
      soundEnabled: false,
    });
    expect((await service.read()).sessions[0].breakEndsAt).toBe(end);
    vi.setSystemTime(Date.now() + 120000);
    expect((await service.read()).sessions).toHaveLength(1);
    expect((await service.read()).sessions[0].actualMs).toBe(60000);
  });
  it("损坏的数据不会被覆盖，存储失败会明确报错", async () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    await expect(service.read()).rejects.toThrow("无法读取");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{oops");
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    });
    await expect(createTask()).rejects.toThrow("保存失败");
  });
  it("使用 Web Locks 串行化跨标签页的开始操作", async () => {
    let queue = Promise.resolve();
    vi.stubGlobal("navigator", {
      locks: {
        request: (_name: string, operation: () => unknown) => {
          const next = queue.then(operation);
          queue = next.then(() => undefined);
          return next;
        },
      },
    });
    const task = await createTask();
    const [first, second] = await Promise.all([
      service.start(task.id),
      service.start(task.id),
    ]);
    expect(first.id).toBe(second.id);
    expect((await service.read()).sessions).toHaveLength(1);
  });
});
