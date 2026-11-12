import { Link } from "react-router";
import { ArrowLeft, Signpost } from "lucide-react";
import { Button } from "@/components/ui/button";
export const NotFoundPage = () => (
  <section className="fg-not-found">
    <span className="fg-not-found-sign">
      <Signpost size={58} strokeWidth={1.3} aria-hidden="true" />
    </span>
    <p className="fg-eyebrow">404 · A LITTLE OFF THE PATH</p>
    <h1>好像走到花园的小路外了</h1>
    <p>没关系，回到熟悉的地方，再种下一点美好。</p>
    <Button asChild>
      <Link to="/">
        <ArrowLeft size={17} aria-hidden="true" />
        返回今日任务
      </Link>
    </Button>
  </section>
);
