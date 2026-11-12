import axios from "axios";
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  constructor(
    message: string,
    status: number | null = null,
    code = "REQUEST_ERROR",
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (!axios.isAxiosError(error))
      return Promise.reject(
        error instanceof Error ? error : new ApiError("请求失败，请重试"),
      );
    const message = error.response?.data?.message;
    return Promise.reject(
      new ApiError(
        typeof message === "string"
          ? message
          : error.code === "ECONNABORTED"
            ? "请求超时，操作结果尚未确认，请先刷新列表核对后再重试。"
            : error.response
              ? `请求失败（${error.response.status}），请重试。`
              : "无法连接后端，请确认服务已启动，或检查 API 地址与网络。",
        error.response?.status ?? null,
        typeof error.response?.data?.code === "string"
          ? error.response.data.code
          : (error.code ?? "NETWORK_ERROR"),
      ),
    );
  },
);
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请稍后重试";
