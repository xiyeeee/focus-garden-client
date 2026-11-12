import type { ReactNode } from "react";
import { Sprout } from "lucide-react";
export const PageHeading = ({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
}) => (
  <header className="fg-page-heading">
    <div>
      {eyebrow && <p className="fg-eyebrow">{eyebrow}</p>}
      <h1>
        {title}
        <Sprout size={24} aria-hidden="true" />
      </h1>
      <p className="fg-page-description">{description}</p>
    </div>
    {action && <div className="fg-page-action">{action}</div>}
  </header>
);
