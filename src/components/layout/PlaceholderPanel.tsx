import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
export const PlaceholderPanel = ({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
  className?: string;
}) => (
  <section className={`fg-card fg-placeholder-panel ${className}`}>
    <div className="fg-panel-title">
      <span className="fg-panel-icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
    </div>
    <p className="fg-panel-description">{description}</p>
    {children}
  </section>
);
