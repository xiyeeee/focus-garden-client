import { errorMessage } from "@/services/http";
import { useRef, useState } from "react";
import { LogOut, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/PageHeading";
import { useAuth } from "@/features/auth/AuthProvider";
export const SettingsPage = () => {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const exit = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
      pending.current = false;
    }
  };
  return (
    <>
      <PageHeading
        title="设置"
        description="管理你的登录状态。"
        eyebrow="YOUR GARDEN ACCOUNT"
      />
      <section className="fg-card fg-account-settings" aria-label="账号设置">
        <div>
          <h2>退出登录</h2>
          <p>退出后将返回登录页，再次登录后才能进入花园。</p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void exit()}>
          {busy ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <LogOut size={17} aria-hidden="true" />
          )}
          {busy ? "退出中…" : "退出登录"}
        </Button>
        {error && (
          <p className="fg-task-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </>
  );
};
