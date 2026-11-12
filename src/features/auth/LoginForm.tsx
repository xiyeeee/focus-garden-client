import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { LoaderCircle, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, errorMessage } from "@/services/http";
import { useCooldown } from "@/hooks/useCooldown";
import { AuthTextField, AuthPasswordField } from "./AuthFields";
import {
  validateLogin,
  type LoginErrors,
  type LoginSubmit,
  type LoginMode,
} from "./login-form";
export const LoginForm = ({ onSubmit, initialMode = "username" }: { onSubmit: LoginSubmit; initialMode?: LoginMode }) => {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const pending = useRef(false);
  const cooldown = useCooldown();
  const credentials = mode === "username" ? { username, password } : { email, password };
  const validateField = (field: keyof LoginErrors) =>
    setErrors((current) => ({
      ...current,
      [field]: validateLogin(credentials)[field],
    }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current || cooldown.seconds > 0) return;
    const fieldErrors = validateLogin(credentials);
    setErrors(fieldErrors);
    setSubmitError("");
    if (Object.keys(fieldErrors).length) return;
    pending.current = true;
    setSubmitting(true);
    try {
      await onSubmit(credentials);
    } catch (error) {
      setSubmitError(errorMessage(error));
      if (error instanceof ApiError && error.status === 429)
        cooldown.start(error.retryAfter ?? 60);
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };
  return (
    <form
      className="fg-login-form"
      noValidate
      onSubmit={(event) => void submit(event)}
      aria-label={mode === "username" ? "用户名密码登录" : "邮箱密码登录"}
    >
      <div className="fg-login-modes" role="group" aria-label="登录方式">
        {(["username", "email"] as const).map((option) => (
          <Button key={option} type="button" variant="ghost"
            aria-pressed={mode === option} disabled={submitting}
            onClick={() => { setMode(option); setErrors({}); setSubmitError(""); }}>
            {option === "username" ? "用户名登录" : "邮箱登录"}
          </Button>
        ))}
      </div>
      <fieldset disabled={submitting}>
        <legend className="sr-only">登录信息</legend>
        {mode === "username" ? (
          <AuthTextField id="login-username" label="用户名" icon={UserRound}
            name="username" autoComplete="username" placeholder="请输入用户名"
            value={username} onChange={(event) => {
              setUsername(event.target.value);
              setErrors((current) => ({ ...current, identity: undefined }));
              setSubmitError("");
            }} onBlur={() => validateField("identity")} error={errors.identity} required />
        ) : (<AuthTextField
          id="login-email"
          label="邮箱"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          placeholder="请输入邮箱"
          maxLength={254}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, identity: undefined }));
            setSubmitError("");
          }}
          onBlur={() => validateField("identity")}
          error={errors.identity}
          required
        />
        )}
        <AuthPasswordField
          id="login-password"
          label="密码"
          name="password"
          autoComplete="current-password"
          placeholder="请输入密码"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
            setSubmitError("");
          }}
          onBlur={() => validateField("password")}
          error={errors.password}
          required
        />
        {mode === "email" ? <div className="fg-login-forgot">
          <Link to="/forgot-password" className="fg-auth-text-link">
            忘记密码？
          </Link>
        </div> : <p className="fg-login-help">用户名账号暂不支持邮箱找回密码。</p>}
        <Button
          type="submit"
          className="fg-login-submit"
          disabled={submitting || cooldown.seconds > 0}
        >
          {submitting && <LoaderCircle size={18} className="animate-spin" />}
          {submitting
            ? "登录中…"
            : cooldown.seconds > 0
              ? `${cooldown.seconds} 秒后重试`
              : "登录"}
        </Button>
      </fieldset>
      {submitError && (
        <p className="fg-login-submit-error" role="alert">
          {submitError}
        </p>
      )}
      <p className="fg-login-register">
        还没有账号？
        <Link to="/register" className="fg-auth-text-link">
          立即注册
        </Link>
      </p>
    </form>
  );
};
