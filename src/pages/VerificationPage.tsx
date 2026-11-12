import { Navigate } from "react-router";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthLayout, AuthCardHeading } from "@/features/auth/AuthLayout";
import { VerificationForm } from "@/features/auth/VerificationForm";
export const VerificationPage = ({ mode }: { mode: "register" | "reset" }) => {
  const { status } = useAuth();
  if (mode === "register" && status === "authenticated")
    return <Navigate to="/" replace />;
  return (
    <AuthLayout>
      <AuthCardHeading
        title={mode === "register" ? "开启你的花园" : "找回密码"}
        description={
          mode === "register"
            ? "验证邮箱，种下第一份专注。"
            : "通过邮箱验证，重新回到你的花园。"
        }
      />
      <VerificationForm key={mode} mode={mode} />
    </AuthLayout>
  );
};
