import { Sun, UserRound } from "lucide-react";
export const HeaderActions = () => (
  <div className="fg-header-actions">
    <span
      className="fg-light-indicator"
      role="img"
      aria-label="当前为明亮模式"
      title="明亮模式"
    >
      <Sun size={22} aria-hidden="true" />
    </span>
    <span className="fg-action-divider" />
    <span
      className="fg-visitor-avatar"
      role="img"
      aria-label="访客头像，账号功能暂未开放"
    >
      <UserRound size={23} aria-hidden="true" />
    </span>
  </div>
);
