import axios, { AxiosHeaders } from "axios";
import { createCsrfManager } from "./csrf";
import type { CsrfVO } from "./auth/types";
import type { ApiResponse } from "./tasks/types";
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly retryAfter: number | null;
  constructor(
    message: string,
    status: number | null = null,
    code = "REQUEST_ERROR",
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请稍后重试";
export const unwrapApiResponse = <T>(body: ApiResponse<T>): T => {
  if (!body || body.code !== "OK" || !Object.hasOwn(body, "data"))
    throw new ApiError(
      "接口响应格式不正确，请检查 API 地址与代理配置。",
      null,
      "INVALID_RESPONSE",
    );
  return body.data;
};
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  withCredentials: true,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});
const csrf = createCsrfManager(async () => {
  const response = await http.get<ApiResponse<CsrfVO>>("/auth/csrf");
  const token = unwrapApiResponse(response.data);
  if (
    !token ||
    token.headerName !== "X-CSRF-TOKEN" ||
    typeof token.token !== "string" ||
    !token.token
  )
    throw new ApiError(
      "页面验证信息不正确，请重试。",
      null,
      "INVALID_RESPONSE",
    );
  return token;
});
export const refreshCsrf = csrf.refresh;
export const clearCsrf = csrf.clear;
let sessionEpoch = 0;
const requestEpochs = new WeakMap<object, number>();
const expiredListeners = new Set<() => void>();
export const subscribeSessionExpired = (listener: () => void) => {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
};
// 会话切换后，旧请求不能向新账号缓存写入结果。
export const advanceSessionEpoch = () => {
  sessionEpoch++;
  csrf.clear();
};
http.interceptors.request.use(async (config) => {
  requestEpochs.set(config, sessionEpoch);
  const method = (config.method ?? "get").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = await csrf.get();
    config.headers.set(token.headerName, token.token);
  }
  if (requestEpochs.get(config) !== sessionEpoch)
    throw new ApiError("登录状态已变更，请重新操作。", null, "SESSION_CHANGED");
  return config;
});
http.interceptors.response.use(
  (response) => {
    if (requestEpochs.get(response.config) !== sessionEpoch)
      throw new ApiError(
        "登录状态已变更，本次旧请求结果已忽略。",
        null,
        "SESSION_CHANGED",
      );
    return response;
  },
  async (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (!axios.isAxiosError(error))
      return Promise.reject(
        error instanceof Error ? error : new ApiError("请求失败，请重试"),
      );
    if (error.config && requestEpochs.get(error.config) !== sessionEpoch)
      return Promise.reject(
        new ApiError(
          "登录状态已变更，本次旧请求结果已忽略。",
          null,
          "SESSION_CHANGED",
        ),
      );
    const status = error.response?.status ?? null;
    const code =
      typeof error.response?.data?.code === "string"
        ? error.response.data.code
        : (error.code ?? "NETWORK_ERROR");
    const serverMessage = error.response?.data?.message;
    let message =
      typeof serverMessage === "string"
        ? serverMessage
        : error.code === "ECONNABORTED"
          ? "请求超时，操作结果尚未确认，请核对后再重试。"
          : status
            ? `请求失败（${status}），请重试。`
            : "无法连接后端，请确认服务已启动，或检查 API 地址与网络。";
    const responseHeaders = error.response?.headers;
    const rawRetry =
      responseHeaders instanceof AxiosHeaders
        ? responseHeaders.get("Retry-After")
        : responseHeaders?.["retry-after"] ?? responseHeaders?.["Retry-After"];
    const parsedRetry =
      rawRetry === undefined || rawRetry === null ? null : Number(rawRetry);
    const retryAfter =
      parsedRetry !== null && Number.isFinite(parsedRetry) && parsedRetry >= 0
        ? Math.ceil(parsedRetry)
        : null;
    if (status === 401) {
      csrf.clear();
      if (
        code !== "INVALID_CREDENTIALS" &&
        !error.config?.url?.endsWith("/users/me")
      )
        expiredListeners.forEach((listener) => listener());
    }
    if (
      status === 403 &&
      code === "CSRF_INVALID" &&
      !error.config?.url?.endsWith("/auth/csrf")
    ) {
      try {
        await csrf.refresh();
        message = "页面验证已更新，请重试刚才的操作。";
      } catch {
        message = "页面验证已过期，请检查网络后重试。";
      }
    }
    return Promise.reject(new ApiError(message, status, code, retryAfter));
  },
);
