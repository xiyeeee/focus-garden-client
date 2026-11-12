import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { authApi } from "./api";
import {
  advanceSessionEpoch,
  clearCsrf,
  http,
  subscribeSessionExpired,
} from "@/services/http";
const user = {
  id: "9223372036854775807",
  email: "gardener+tag@example.com",
  nickname: "新朋友",
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: "2026-11-12T06:00:00Z",
  updatedAt: "2026-11-12T06:00:00Z",
};
const originalAdapter = http.defaults.adapter;
let requests: InternalAxiosRequestConfig[];
let authenticated: boolean;
let version: number;
let failCsrfAfterLogin: boolean;
let invalidOnce: boolean;
let retryLogin: boolean;
beforeEach(() => {
  clearCsrf();
  requests = [];
  authenticated = false;
  version = 0;
  failCsrfAfterLogin = false;
  invalidOnce = false;
  retryLogin = false;
  http.defaults.adapter = async (config) => {
    requests.push(config);
    const respond = (data: unknown) => ({
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
      data: { code: "OK", message: "成功", data },
    });
    const fail = (
      status: number,
      code: string,
      message: string,
      headers = new AxiosHeaders(),
    ): never => {
      throw new AxiosError(message, "ERR_BAD_REQUEST", config, null, {
        status,
        statusText: "failed",
        headers,
        config,
        data: { code, message, data: null },
      });
    };
    if (config.url === "/auth/csrf") {
      if (authenticated && failCsrfAfterLogin) {
        failCsrfAfterLogin = false;
        return fail(503, "SERVICE_UNAVAILABLE", "暂不可用");
      }
      return respond({ headerName: "X-CSRF-TOKEN", token: `token-${version}` });
    }
    if (config.url === "/users/me")
      return authenticated
        ? respond(user)
        : fail(401, "UNAUTHORIZED", "请先登录");
    if (
      config.method !== "get" &&
      (config.headers.get("X-CSRF-TOKEN") !== `token-${version}` || invalidOnce)
    ) {
      invalidOnce = false;
      return fail(403, "CSRF_INVALID", "验证失败");
    }
    if (config.url === "/auth/login") {
      if (retryLogin)
        return fail(
          429,
          "RATE_LIMITED",
          "请求过于频繁",
          new AxiosHeaders({ "Retry-After": "12" }),
        );
      authenticated = true;
      version++;
      return respond(user);
    }
    if (
      config.url === "/auth/logout" ||
      config.url === "/auth/password/reset"
    ) {
      authenticated = false;
      version++;
      return respond(null);
    }
    if (config.url === "/auth/register") return respond(user);
    return respond(null);
  };
});
afterEach(() => {
  http.defaults.adapter = originalAdapter;
  clearCsrf();
});
describe("Session + CSRF 认证请求", () => {
  it("首次打开按 csrf → me 查询，401 转未登录而非假成功", async () => {
    expect(await authApi.getSession()).toBeNull();
    expect(requests.map((request) => request.url)).toEqual([
      "/auth/csrf",
      "/users/me",
    ]);
    expect(requests.every((request) => request.withCredentials)).toBe(true);
  });
  it("登录密码原样发送、邮箱规范化、登录后轮换 CSRF 供任务写请求使用", async () => {
    const session = await authApi.login({
      email: "  GARDENER+TAG@Example.com  ",
      password: "  密码 🌱 1234  ",
    });
    expect(session.user.id).toBe(user.id);
    const login = requests.find((request) => request.url === "/auth/login")!;
    expect(JSON.parse(login.data)).toEqual({
      email: "gardener+tag@example.com",
      password: "  密码 🌱 1234  ",
    });
    expect(login.headers.get("X-CSRF-TOKEN")).toBe("token-0");
    await http.post("/tasks", { title: "任务" });
    expect(requests.at(-1)!.headers.get("X-CSRF-TOKEN")).toBe("token-1");
    expect(
      requests.filter((request) => request.url === "/auth/login"),
    ).toHaveLength(1);
  });
  it("登录 POST 已成功而 CSRF 刷新失败时验证 me，不重放登录或误报密码错误", async () => {
    failCsrfAfterLogin = true;
    const result = await authApi.login({
      email: user.email,
      password: "password123",
    });
    expect(result.user.id).toBe(user.id);
    expect(
      requests.filter((request) => request.url === "/auth/login"),
    ).toHaveLength(1);
    expect(requests.at(-1)!.url).toBe("/users/me");
    await http.post("/tasks", {});
    expect(requests.at(-1)!.headers.get("X-CSRF-TOKEN")).toBe("token-1");
  });
  it("退出无请求体并刷新下一次登录所用 CSRF", async () => {
    await authApi.login({ email: user.email, password: "password123" });
    await authApi.logout();
    const logout = requests.find((request) => request.url === "/auth/logout")!;
    expect(logout.data).toBeUndefined();
    expect(requests.at(-1)!.url).toBe("/auth/csrf");
    expect(authenticated).toBe(false);
  });
  it("发码、注册和重置保留字符串前导零，不发送确认密码或任意用户身份", async () => {
    await authApi.emailCode({
      email: " TEST@EXAMPLE.COM ",
      purpose: "REGISTER",
    });
    await authApi.register({
      email: user.email,
      password: "  password  ",
      verificationCode: "012345",
      nickname: "新朋友",
    });
    await authApi.resetPassword({
      email: user.email,
      newPassword: " 新密码 🌱 123 ",
      verificationCode: "000123",
    });
    expect(
      JSON.parse(
        requests.find((request) => request.url === "/auth/register")!.data,
      ).verificationCode,
    ).toBe("012345");
    expect(
      JSON.parse(
        requests.find((request) => request.url === "/auth/password/reset")!
          .data,
      ),
    ).toEqual({
      email: user.email,
      newPassword: " 新密码 🌱 123 ",
      verificationCode: "000123",
    });
    expect(requests.at(-1)!.url).toBe("/auth/csrf");
  });
  it("CSRF_INVALID 刷新令牌并提示重试，写请求不自动重放", async () => {
    invalidOnce = true;
    await expect(
      authApi.emailCode({ email: user.email, purpose: "REGISTER" }),
    ).rejects.toMatchObject({
      status: 403,
      code: "CSRF_INVALID",
      message: "页面验证已更新，请重试刚才的操作。",
    });
    expect(
      requests.filter((request) => request.url === "/auth/email-codes"),
    ).toHaveLength(1);
    expect(
      requests.filter((request) => request.url === "/auth/csrf"),
    ).toHaveLength(2);
  });
  it("限流保留 Retry-After，不自动重试登录", async () => {
    retryLogin = true;
    await expect(
      authApi.login({ email: user.email, password: "password123" }),
    ).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      retryAfter: 12,
    });
    expect(
      requests.filter((request) => request.url === "/auth/login"),
    ).toHaveLength(1);
  });
  it("业务 401 通知清理会话，me 的初次 401 不触发全局循环", async () => {
    let expired = 0;
    const unsubscribe = subscribeSessionExpired(() => {
      expired++;
    });
    try {
      await authApi.getSession();
      expect(expired).toBe(0);
      http.defaults.adapter = async (config) => {
        throw new AxiosError("未登录", "ERR_BAD_REQUEST", config, null, {
          status: 401,
          statusText: "Unauthorized",
          headers: new AxiosHeaders(),
          config,
          data: { code: "UNAUTHORIZED", message: "请先登录", data: null },
        });
      };
      await expect(http.get("/tasks")).rejects.toMatchObject({ status: 401 });
      expect(expired).toBe(1);
    } finally {
      unsubscribe();
    }
  });
  it("切换会话后，延迟返回的旧业务响应不会进入新账号缓存", async () => {
    let finish: () => void = () => {};
    let started: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const delayed = new Promise<void>((resolve) => {
      finish = resolve;
    });
    http.defaults.adapter = async (config) => {
      started();
      await delayed;
      return {
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        config,
        data: { code: "OK", message: "成功", data: { oldUser: true } },
      };
    };
    const request = http.get("/tasks");
    await ready;
    advanceSessionEpoch();
    finish();
    await expect(request).rejects.toMatchObject({ code: "SESSION_CHANGED" });
  });
});
