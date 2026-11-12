import type { LoginDTO } from "@/services/auth/types";
export type LoginCredentials = LoginDTO;
export type LoginMode = "username" | "email";
export type LoginErrors = Partial<Record<"identity" | "password", string>>;
export type LoginSubmit = (credentials: LoginCredentials) => Promise<void>;
export const validateEmail = (email: string) => {
  const value = email.trim();
  if (!value) return "请输入邮箱地址";
  if (
    value.length > 254 ||
    /[^\x21-\x7e]/.test(value) ||
    !/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(value)
  )
    return "请输入有效的 ASCII 邮箱地址（最多 254 字符）";
  return undefined;
};
export const validatePassword = (password: string) =>
  !password
    ? "请输入密码"
    : password.length < 8 || password.length > 128
      ? "密码长度为 8–128 个字符"
      : undefined;
export const validateUsername = (username: string) => {
  if (!username.trim()) return "请输入用户名";
  return /^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(username.trim())
    ? undefined
    : "用户名为 3–32 位字母、数字或下划线，且以字母开头";
};
export const validateLogin = (credentials: LoginCredentials): LoginErrors => {
  const identity = credentials.username !== undefined
    ? validateUsername(credentials.username)
    : validateEmail(credentials.email);
  const password = validatePassword(credentials.password);
  return { ...(identity ? { identity } : {}), ...(password ? { password } : {}) };
};
