import { Link } from "react-router";
import { Sprout } from "lucide-react";
export const Brand = ({ interactive = true }: { interactive?: boolean }) => {
  const content = (
    <>
      <span className="fg-brand-mark">
        <Sprout aria-hidden="true" />
      </span>
      <span>
        专注花园<small>FOCUS GARDEN</small>
      </span>
    </>
  );
  return interactive ? (
    <Link to="/" className="fg-brand" aria-label="专注花园首页">
      {content}
    </Link>
  ) : (
    <div className="fg-brand" aria-label="专注花园">
      {content}
    </div>
  );
};
