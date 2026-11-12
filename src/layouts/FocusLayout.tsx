import { useRouteScroll } from "@/hooks/useRouteScroll";
import { Link, Outlet } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { Button } from "@/components/ui/button";
export const FocusLayout = () => {
  const scrollRef = useRouteScroll();
  return (
    <div className="fg-focus-shell">
      <a className="fg-skip-link" href="#focus-content">
        跳到主要内容
      </a>
      <header className="fg-focus-header">
        <Brand />
        <Button asChild variant="outline" className="fg-focus-back">
          <Link to="/">
            <ArrowLeft size={17} aria-hidden="true" />
            返回首页
          </Link>
        </Button>
        <HeaderActions />
      </header>
      <main
        ref={scrollRef}
        className="fg-focus-scroll"
        id="focus-content"
        tabIndex={-1}
      >
        <div className="fg-focus-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
