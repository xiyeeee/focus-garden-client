import { LoaderCircle, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
export const AuthStatus = ({
  failed = false,
  onRetry,
}: {
  failed?: boolean;
  onRetry: () => void;
}) => (
  <main className="fg-auth-status">
    <span className="fg-brand-mark">
      <Sprout size={35} aria-hidden="true" />
    </span>
    {failed ? (
      <>
        <h1>暂时无法确认登录状态</h1>
        <p role="alert">请重试，确认登录状态后再进入花园。</p>
        <Button onClick={onRetry}>重试验证</Button>
      </>
    ) : (
      <p role="status">
        <LoaderCircle size={19} className="animate-spin" aria-hidden="true" />
        正在确认登录状态…
      </p>
    )}
  </main>
);
