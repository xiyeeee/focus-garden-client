export interface LoginCredentials {
  email: string;
  password: string;
}
export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>;
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
export const validateLogin = ({
  email,
  password,
}: LoginCredentials): LoginErrors => {
  const errors: LoginErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
};
