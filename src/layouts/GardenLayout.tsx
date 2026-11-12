import { useRouteScroll } from "@/hooks/useRouteScroll";
import { Outlet, useLocation } from "react-router";
import { Leaf, Sprout } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { Navigation } from "@/components/layout/Navigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { HeaderActions } from "@/components/layout/HeaderActions";
export const GardenLayout = () => {
  const { pathname } = useLocation();
  const scrollRef = useRouteScroll();
  return (
    <div className="fg-app-shell">
      <a className="fg-skip-link" href="#main-content">
        跳到主要内容
      </a>
      <aside className="fg-sidebar" aria-label="侧边栏">
        <Brand />
        <Navigation />
        <div className="fg-sidebar-garden" aria-hidden="true">
          <span className="fg-sidebar-plant">
            <Sprout size={48} />
          </span>
          <p>
            种下一份专注
            <br />
            收获更好的自己
          </p>
          <span className="fg-small-leaf">
            <Leaf size={21} />
          </span>
        </div>
        <p className="fg-sidebar-footer">慢慢来，也在生长。</p>
      </aside>
      <div className="fg-workspace">
        <header className="fg-topbar">
          <div className="fg-mobile-brand">
            <MobileNavigation key={pathname} />
            <Brand />
          </div>
          <p className="fg-topbar-motto">
            <Leaf size={15} aria-hidden="true" />
            把想做的事，种进今天的花园。
          </p>
          <HeaderActions />
        </header>
        <main
          ref={scrollRef}
          className="fg-content-scroll"
          id="main-content"
          tabIndex={-1}
        >
          <div className="fg-content">
            <Outlet />
            <footer className="fg-page-footer">
              <span>每一份专注，都值得被温柔以待。</span>
              <span>FOCUS GARDEN</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};
