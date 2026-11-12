import {
  ApiError,
  advanceSessionEpoch,
  http,
  refreshCsrf,
  unwrapApiResponse,
} from "@/services/http";
import type { ApiResponse } from "@/services/tasks/types";
import type {
  EmailCodeDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
  UserVO,
} from "./types";
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeIdentity = (body: LoginDTO) =>
  body.username !== undefined
    ? { username: body.username.trim().toLowerCase() }
    : { email: normalizeEmail(body.email) };
const readUser = (user: UserVO): UserVO => {
  if (
    !user ||
    typeof user.id !== "string" ||
    !/^[1-9]\d*$/.test(user.id) ||
    (user.email !== null && typeof user.email !== "string") ||
    (user.username !== null && typeof user.username !== "string") ||
    (!user.email && !user.username) ||
    typeof user.nickname !== "string"
  )
    throw new ApiError(
      "用户信息格式不正确，请重试验证。",
      null,
      "INVALID_RESPONSE",
    );
  return user;
};
const me = async () => {
  const response = await http.get<ApiResponse<UserVO>>("/users/me");
  return readUser(unwrapApiResponse(response.data));
};
const refreshAfterSessionChange = async () => {
  advanceSessionEpoch();
  await refreshCsrf();
};
export const authApi = {
  me,
  getSession: async () => {
    await refreshCsrf();
    try {
      return { user: await me() };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  login: async (body: LoginDTO) => {
    const response = await http.post<ApiResponse<UserVO>>("/auth/login", {
      ...normalizeIdentity(body),
      password: body.password,
    });
    const user = readUser(unwrapApiResponse(response.data));
    try {
      await refreshAfterSessionChange();
    } catch {
      // 登录 POST 已成功，不重放；确认 Cookie 会话后允许进入，下一次写操作会重新取 CSRF。
      try {
        return { user: await me() };
      } catch {
        throw new ApiError(
          "登录请求已处理，但会话确认失败，请刷新页面重新验证。",
          null,
          "SESSION_CONFIRMATION_FAILED",
        );
      }
    }
    return { user };
  },
  logout: async () => {
    const response = await http.post<ApiResponse<null>>("/auth/logout");
    unwrapApiResponse(response.data);
    try {
      await refreshAfterSessionChange();
    } catch {
      /* 已退出成功；下次登录前会重新取得 CSRF。 */
    }
  },
  emailCode: async (body: EmailCodeDTO) => {
    const response = await http.post<ApiResponse<null>>("/auth/email-codes", {
      email: normalizeEmail(body.email),
      purpose: body.purpose,
    });
    unwrapApiResponse(response.data);
  },
  register: async (body: RegisterDTO) => {
    const response = await http.post<ApiResponse<UserVO>>("/auth/register", {
      password: body.password,
      nickname: body.nickname,
      ...normalizeIdentity(body),
      ...(body.username === undefined ? { verificationCode: body.verificationCode } : {}),
    });
    return readUser(unwrapApiResponse(response.data));
  },
  resetPassword: async (body: ResetPasswordDTO) => {
    const response = await http.post<ApiResponse<null>>(
      "/auth/password/reset",
      { ...body, email: normalizeEmail(body.email) },
    );
    unwrapApiResponse(response.data);
    try {
      await refreshAfterSessionChange();
    } catch {
      /* 密码重置已成功；下次登录时重新取 CSRF。 */
    }
  },
};
