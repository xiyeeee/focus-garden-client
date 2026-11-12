import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { http, ApiError } from "@/services/http";
import { taskApi } from "./api";
import { toTaskRecord, toTaskCreateDTO, toTaskUpdateDTO } from "./adapter";
import type { TaskVO } from "./types";

const original: TaskVO = {
  id: "9223372036854775807",
  title: "设计任务",
  description: "  保留备注空白  ",
  plannedFocusMinutes: 1440,
  status: "IN_PROGRESS",
  plantType: "tulip",
  createdAt: "2026-11-12T03:00:00.123456Z",
  updatedAt: "2026-11-12T03:05:00Z",
  completedAt: null,
};
const draft = {
  title: "  修改任务  ",
  notes: "  新备注  ",
  plannedMinutes: 45,
  plantType: "daisy" as const,
};
const originalAdapter = http.defaults.adapter;
let requests: InternalAxiosRequestConfig[];
let nextBody: unknown;
beforeEach(() => {
  requests = [];
  nextBody = { ...original };
  http.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      data: { code: "OK", message: "成功", data: nextBody },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    };
  };
});
afterEach(() => {
  http.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

describe("任务 HTTP 契约与适配", () => {
  it("保留大整数字符串 ID、三态、植物偏好与 UTC 时间", () => {
    const task = toTaskRecord(original);
    expect(task.id).toBe("9223372036854775807");
    expect(task.status).toBe("IN_PROGRESS");
    expect(task.createdAt).toBe(Date.parse(original.createdAt));
    expect(task.completedAt).toBeNull();
    expect(task.notes).toBe(original.description);
    expect(task.plannedMinutes).toBe(1440);
  });
  it("新增显式 TODO，编辑保留 IN_PROGRESS，PUT 无只读字段", () => {
    expect(toTaskCreateDTO(draft)).toEqual({
      title: "修改任务",
      description: "  新备注  ",
      plannedFocusMinutes: 45,
      status: "TODO",
      plantType: "daisy",
    });
    expect(toTaskUpdateDTO(draft, toTaskRecord(original)).status).toBe(
      "IN_PROGRESS",
    );
    expect(
      Object.keys(toTaskUpdateDTO(draft, toTaskRecord(original))).sort(),
    ).toEqual([
      "description",
      "plannedFocusMinutes",
      "plantType",
      "status",
      "title",
    ]);
  });
  it("分页按真实 page/size/total 取数，保留查询与取消信号", async () => {
    nextBody = { page: 2, size: 10, total: 31, records: [original] };
    const controller = new AbortController();
    const result = await taskApi.list(
      { page: 2, size: 10, status: "IN_PROGRESS", title: "%_" },
      controller.signal,
    );
    expect(result.total).toBe(31);
    expect(result.records[0].id).toBe(original.id);
    expect(requests[0].params).toEqual({
      page: 2,
      size: 10,
      status: "IN_PROGRESS",
      title: "%_",
    });
    expect(requests[0].signal).toBe(controller.signal);
  });
  it("详情与更新按字符串 ID 请求，完整 PUT 保持原状态", async () => {
    const task = await taskApi.get(original.id);
    await taskApi.update(task, draft);
    expect(requests.map((request) => [request.method, request.url])).toEqual([
      ["get", `/tasks/${original.id}`],
      ["put", `/tasks/${original.id}`],
    ]);
    expect(JSON.parse(requests[1].data)).toMatchObject({
      status: "IN_PROGRESS",
      description: "  新备注  ",
      plantType: "daisy",
    });
  });
  it("完成和删除不发送伪造时间、奖励字段或请求体", async () => {
    nextBody = {
      ...original,
      status: "COMPLETED",
      completedAt: "2026-11-12T04:00:00Z",
    };
    await taskApi.complete(original.id);
    nextBody = null;
    await taskApi.delete(original.id);
    expect(
      requests.map((request) => [request.method, request.url, request.data]),
    ).toEqual([
      ["post", `/tasks/${original.id}/complete`, undefined],
      ["delete", `/tasks/${original.id}`, undefined],
    ]);
  });
  it("新增 POST 无前端 ID，重新打开使用 TODO 并完整回传植物和描述", async () => {
    await taskApi.create(draft);
    await taskApi.reopen(
      toTaskRecord({
        ...original,
        status: "COMPLETED",
        completedAt: "2026-11-12T04:00:00Z",
      }),
    );
    expect(requests[0].method).toBe("post");
    expect(requests[0].url).toBe("/tasks");
    expect(JSON.parse(requests[0].data)).not.toHaveProperty("id");
    expect(JSON.parse(requests[1].data)).toMatchObject({
      status: "TODO",
      plantType: "tulip",
      description: original.description,
      plannedFocusMinutes: 1440,
    });
  });
  it("保留非 2xx 的 HTTP status/code/message，支持按 404 分支处理", async () => {
    http.defaults.adapter = async (config) => {
      const response: AxiosResponse = {
        status: 404,
        statusText: "Not Found",
        headers: new AxiosHeaders(),
        config,
        data: { code: "NOT_FOUND", message: "任务不存在", data: null },
      };
      throw new AxiosError("failed", "ERR_BAD_REQUEST", config, null, response);
    };
    await expect(taskApi.get(original.id)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "任务不存在",
    });
  });
  it("代理返回 HTML 或错误分页结构时拒绝伪装空数据", async () => {
    http.defaults.adapter = async (config) => ({
      data: "<!doctype html>",
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    });
    await expect(taskApi.list({})).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
  it("非法 ID 在发请求前拒绝，非法状态或时间不会静默映射", async () => {
    await expect(taskApi.get("../1")).rejects.toBeInstanceOf(ApiError);
    expect(requests).toHaveLength(0);
    expect(() =>
      toTaskRecord({ ...original, createdAt: "not-a-date" }),
    ).toThrow("时间格式");
  });
  it("请求失败时不会降级写入 mock 数据", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    http.defaults.adapter = async (config) => {
      throw new AxiosError("offline", "ERR_NETWORK", config);
    };
    try {
      await expect(taskApi.create(draft)).rejects.toMatchObject({
        status: null,
        code: "ERR_NETWORK",
      });
      expect(setItem).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
