import type { Page } from "@playwright/test";
import type { UserVO } from "../../src/services/auth/types.ts";
// 只拦截已确认的后端 HTTP 路径，浏览器运行真实 Axios/CSRF/认证适配代码。
export const interceptAuthService = async (
  page: Page,
  authenticated = false,
) => {
  const state = {
    authenticated,
    failLogin: false,
    failLogout: false,
    failSession: false,
    failCsrf: false,
    failMail: false,
    failRegister: false,
    failReset: false,
    rateLimitLogin: false,
    rateLimitMail: false,
    csrfFailAfterLogin: false,
    csrfFailureConsumed: false,
    invalidCsrfOnce: false,
    loginCalls: 0,
    logoutCalls: 0,
    csrfCalls: 0,
    meCalls: 0,
    emailCalls: 0,
    registerCalls: 0,
    resetCalls: 0,
    csrfVersion: 0,
    invalidCsrfCalls: 0,
    lastPurpose: "",
    lastCode: "",
    lastPassword: "",
    lastLoginBody: {} as Record<string, string>,
    user: {
      id: "1",
      email: "gardener@example.com",
      username: null,
      nickname: "花园新朋友",
      avatarUrl: null,
      lastLoginAt: null,
      createdAt: "2026-11-12T06:00:00Z",
      updatedAt: "2026-11-12T06:00:00Z",
    } as UserVO,
  };
  const success = (data: unknown, status = 200) => ({
    status,
    json: { code: "OK", message: "成功", data },
  });
  const failure = (status: number, code: string, message: string) => ({
    status,
    json: { code, message, data: null },
  });
  await page.route("**/api/users/me", async (route) => {
    state.meCalls++;
    if (!route.request().headers().cookie?.includes("GARDEN_SESSION="))
      return route.fulfill(failure(401, "UNAUTHORIZED", "缺少会话 Cookie"));
    if (state.failSession)
      return route.fulfill(
        failure(503, "SERVICE_UNAVAILABLE", "暂时无法核对身份"),
      );
    return route.fulfill(
      state.authenticated
        ? success(state.user)
        : failure(401, "UNAUTHORIZED", "请先登录或重新登录"),
    );
  });
  await page.route("**/api/auth/**", async (route) => {
    const request = route.request();
    const action = new URL(request.url()).pathname.slice("/api/auth/".length);
    if (action === "csrf") {
      state.csrfCalls++;
      if (
        state.failCsrf ||
        (state.csrfFailAfterLogin &&
          state.loginCalls > 0 &&
          !state.csrfFailureConsumed)
      ) {
        state.csrfFailureConsumed = true;
        return route.fulfill(
          failure(503, "SERVICE_UNAVAILABLE", "页面验证暂时不可用"),
        );
      }
      return route.fulfill({
        ...success({
          headerName: "X-CSRF-TOKEN",
          token: `test-csrf-${state.csrfVersion}`,
        }),
        headers: {
          "Set-Cookie":
            "GARDEN_SESSION=e2e-session; HttpOnly; Path=/; SameSite=Lax",
        },
      });
    }
    if (
      request.headers()["x-csrf-token"] !== `test-csrf-${state.csrfVersion}` ||
      state.invalidCsrfOnce
    ) {
      state.invalidCsrfOnce = false;
      state.invalidCsrfCalls++;
      return route.fulfill(failure(403, "CSRF_INVALID", "CSRF验证失败"));
    }
    if (action === "logout") {
      state.logoutCalls++;
      if (state.failLogout)
        return route.fulfill(failure(503, "SERVICE_UNAVAILABLE", "退出失败"));
      state.authenticated = false;
      state.csrfVersion++;
      return route.fulfill({
        ...success(null),
        headers: { "Set-Cookie": "GARDEN_SESSION=; Max-Age=0; Path=/" },
      });
    }
    const body = request.postDataJSON();
    if (action === "login") {
      state.loginCalls++;
      state.lastLoginBody = body;
      if (!!body.username === !!body.email || Object.keys(body).some((key) => !["username", "email", "password"].includes(key)))
        return route.fulfill(failure(400, "BAD_REQUEST", "登录身份必须二选一"));
      if (state.rateLimitLogin)
        return route.fulfill({
          ...failure(429, "RATE_LIMITED", "请求过于频繁，请稍后重试"),
          headers: { "Retry-After": "2" },
        });
      if (state.failLogin)
        return route.fulfill(
          failure(401, "INVALID_CREDENTIALS", body.username ? "用户名或密码错误" : "邮箱或密码错误"),
        );
      state.user = { ...state.user, username: body.username ?? null, email: body.email ?? null };
      state.authenticated = true;
      state.csrfVersion++;
      return route.fulfill(success(state.user));
    }
    if (action === "email-codes") {
      state.emailCalls++;
      state.lastPurpose = body.purpose;
      if (state.rateLimitMail)
        return route.fulfill({
          ...failure(429, "RATE_LIMITED", "请稍后再获取验证码"),
          headers: { "Retry-After": "2" },
        });
      if (state.failMail)
        return route.fulfill(
          failure(503, "MAIL_UNAVAILABLE", "邮件暂时无法发送，请稍后重试"),
        );
      return route.fulfill(success(null));
    }
    if (action === "register") {
      state.registerCalls++;
      state.lastCode = body.verificationCode;
      state.lastPassword = body.password;
      if (state.failRegister)
        return route.fulfill(
          failure(
            400,
            "VERIFICATION_INVALID",
            "验证码无效或已过期，请重新获取",
          ),
        );
      return route.fulfill(success(state.user, 201));
    }
    if (action === "password/reset") {
      state.resetCalls++;
      state.lastCode = body.verificationCode;
      state.lastPassword = body.newPassword;
      if (state.failReset)
        return route.fulfill(
          failure(
            400,
            "VERIFICATION_INVALID",
            "验证码无效或已过期，请重新获取",
          ),
        );
      state.authenticated = false;
      state.csrfVersion++;
      return route.fulfill(success(null));
    }
    return route.fulfill(failure(404, "NOT_FOUND", "接口不存在"));
  });
  return state;
};
