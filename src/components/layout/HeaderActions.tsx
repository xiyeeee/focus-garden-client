import { Link } from "react-router";
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
    <Link
      to="/settings"
      className="fg-visitor-avatar"
      aria-label="账号设置"
      title="账号设置"
    >
      <UserRound size={23} aria-hidden="true" />
    </Link>
  </div>
);
