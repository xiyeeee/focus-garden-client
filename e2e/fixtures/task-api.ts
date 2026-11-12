import type { Page } from "@playwright/test";
import type { TaskVO } from "../../src/services/tasks/types.ts";
export const taskFixture = (overrides: Partial<TaskVO> = {}): TaskVO => ({
  id: "9223372036854775807",
  title: "后端任务",
  description: "来自服务端",
  plannedFocusMinutes: 25,
  status: "IN_PROGRESS",
  plantType: "tulip",
  createdAt: "2026-11-12T03:00:00Z",
  updatedAt: "2026-11-12T03:00:00Z",
  completedAt: null,
  ...overrides,
});
export const interceptTaskApi = async (page: Page, initial: TaskVO[] = []) => {
  const state = {
    tasks: [...initial],
    writes: [] as {
      method: string;
      path: string;
      body: Record<string, unknown> | undefined;
    }[],
    failList: false,
    failCreate: false,
    failUpdate: false,
    failDetails: false,
    failDelete: false,
    delayCreate: 0,
  };
  let nextId = 100n;
  await page.route("**/api/tasks**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const success = (data: unknown, status = 200) =>
      route.fulfill({ status, json: { code: "OK", message: "成功", data } });
    const failure = (status: number, code: string, message: string) =>
      route.fulfill({ status, json: { code, message, data: null } });
    if (method === "GET" && path === "/api/tasks") {
      if (state.failList)
        return failure(500, "INTERNAL_SERVER_ERROR", "服务暂时不可用");
      const status = url.searchParams.get("status");
      const title = url.searchParams.get("title");
      const current = Number(url.searchParams.get("page") || 1);
      const size = Number(url.searchParams.get("size") || 20);
      const matching = state.tasks.filter(
        (task) =>
          (!status || task.status === status) &&
          (!title || task.title.includes(title)),
      );
      return success({
        page: current,
        size,
        total: matching.length,
        records: matching.slice((current - 1) * size, current * size),
      });
    }
    const id = path.split("/")[3];
    const task = state.tasks.find((task) => task.id === id);
    if (method === "GET") {
      if (state.failDetails || !task)
        return failure(404, "NOT_FOUND", "任务不存在");
      return success(task);
    }
    const body = request.postData()
      ? (request.postDataJSON() as Record<string, unknown>)
      : undefined;
    state.writes.push({ method, path, body });
    if (method === "POST" && path === "/api/tasks") {
      if (state.delayCreate)
        await new Promise((resolve) => setTimeout(resolve, state.delayCreate));
      if (state.failCreate)
        return failure(400, "BAD_REQUEST", "title：标题不能使用该内容");
      const created = taskFixture({
        ...(body as Partial<TaskVO>),
        id: String(nextId++),
        title: String(body!.title).trim(),
      });
      state.tasks.unshift(created);
      return success(created, 201);
    }
    if (!task) return failure(404, "NOT_FOUND", "任务不存在");
    if (method === "PUT") {
      if (state.failUpdate)
        return failure(400, "BAD_REQUEST", "description：备注内容不符合要求");
      Object.assign(task, body);
      task.completedAt =
        task.status === "COMPLETED" ? "2026-11-12T04:00:00Z" : null;
      return success(task);
    }
    if (method === "DELETE") {
      if (state.failDelete)
        return failure(500, "INTERNAL_SERVER_ERROR", "删除失败，请稍后重试");
      state.tasks = state.tasks.filter((task) => task.id !== id);
      return success(null);
    }
    if (method === "POST" && path.endsWith("/complete")) {
      task.status = "COMPLETED";
      task.completedAt ??= "2026-11-12T04:00:00Z";
      return success(task);
    }
    return failure(405, "METHOD_NOT_ALLOWED", "方法不支持");
  });
  return state;
};
