import { NavLink } from "react-router";
import { navigation } from "@/config/navigation";
export const Navigation = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav aria-label="主导航" className="fg-navigation">
    {navigation.map(({ to, label, icon: Icon }) => (
      <NavLink
        end={to === "/"}
        to={to}
        key={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `fg-nav-link ${isActive ? "is-active" : ""}`
        }
      >
        <Icon size={21} aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);
