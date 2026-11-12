import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthStatus } from "@/features/auth/AuthStatus";
import { AuthLayout, AuthCardHeading } from "@/features/auth/AuthLayout";
import { LoginForm } from "@/features/auth/LoginForm";
export const LoginPage = () => {
  const { status, login, retry } = useAuth();
  const location = useLocation();
  if (status === "authenticated") return <Navigate to="/" replace />;
  if (status === "checking") return <AuthStatus onRetry={retry} />;
  if (status === "error") return <AuthStatus failed onRetry={retry} />;
  const notice = location.state?.authNotice;
  return (
    <AuthLayout>
      <AuthCardHeading
        title="欢迎回来"
        description="登录，继续照顾你的专注花园。"
      />
      {typeof notice === "string" && (
        <p className="fg-auth-success" role="status">
          {notice}
        </p>
      )}
      <LoginForm onSubmit={login} initialMode={location.state?.loginMode === "email" ? "email" : "username"} />
    </AuthLayout>
  );
};
