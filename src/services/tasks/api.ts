import { http, ApiError } from "@/services/http";
import type { TaskDraft, TaskRecord } from "@/features/tasks/task-model";
import type { ApiResponse, PageResponse, TaskQueryDTO, TaskVO } from "./types";
import { toTaskRecord, toTaskCreateDTO, toTaskUpdateDTO } from "./adapter";
const unwrap = <T>(body: ApiResponse<T>): T => {
  if (!body || body.code !== "OK" || !Object.hasOwn(body, "data"))
    throw new ApiError(
      "接口响应格式不正确，请检查 API 地址与代理配置。",
      null,
      "INVALID_RESPONSE",
    );
  return body.data;
};
const taskPath = (id: string) => {
  if (!/^[1-9]\d*$/.test(id))
    throw new ApiError("任务 ID 无效。", 400, "BAD_REQUEST");
  return `/tasks/${encodeURIComponent(id)}`;
};
export const taskApi = {
  list: async (
    query: TaskQueryDTO,
    signal?: AbortSignal,
  ): Promise<PageResponse<TaskRecord>> => {
    const response = await http.get<ApiResponse<PageResponse<TaskVO>>>(
      "/tasks",
      { params: query, signal },
    );
    const result = unwrap(response.data);
    if (
      !result ||
      !Array.isArray(result.records) ||
      !Number.isInteger(result.page) ||
      !Number.isInteger(result.size) ||
      result.page < 1 ||
      result.size < 1 ||
      !Number.isFinite(result.total) ||
      result.total < 0
    )
      throw new ApiError("任务分页响应不正确。", null, "INVALID_RESPONSE");
    return { ...result, records: result.records.map(toTaskRecord) };
  },
  get: async (id: string, signal?: AbortSignal) => {
    const response = await http.get<ApiResponse<TaskVO>>(taskPath(id), {
      signal,
    });
    return toTaskRecord(unwrap(response.data));
  },
  create: async (draft: TaskDraft) => {
    const response = await http.post<ApiResponse<TaskVO>>(
      "/tasks",
      toTaskCreateDTO(draft),
    );
    return toTaskRecord(unwrap(response.data));
  },
  update: async (original: TaskRecord, draft: TaskDraft) => {
    const response = await http.put<ApiResponse<TaskVO>>(
      taskPath(original.id),
      toTaskUpdateDTO(draft, original),
    );
    return toTaskRecord(unwrap(response.data));
  },
  complete: async (id: string) => {
    const response = await http.post<ApiResponse<TaskVO>>(
      `${taskPath(id)}/complete`,
    );
    return toTaskRecord(unwrap(response.data));
  },
  reopen: async (task: TaskRecord) => {
    const response = await http.put<ApiResponse<TaskVO>>(taskPath(task.id), {
      ...toTaskUpdateDTO(task, task),
      status: "TODO",
    });
    return toTaskRecord(unwrap(response.data));
  },
  delete: async (id: string) => {
    const response = await http.delete<ApiResponse<null>>(taskPath(id));
    unwrap(response.data);
  },
};
