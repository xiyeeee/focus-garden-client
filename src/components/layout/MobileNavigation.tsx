import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Brand } from "./Brand";
import { Navigation } from "./Navigation";
export const MobileNavigation = () => {
  const [open, setOpen] = useState(false);
  // 包括浏览器后退/前进和抽屉外触发的路由变化。
  useEffect(() => {
    if (!open) return;
    const closeOnRouteChange = () => setOpen(false);
    window.addEventListener("popstate", closeOnRouteChange);
    return () => window.removeEventListener("popstate", closeOnRouteChange);
  }, [open]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 961px)");
    const closeOnDesktop = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", closeOnDesktop);
    return () => query.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fg-mobile-menu"
          variant="ghost"
          size="icon"
          aria-label="打开导航"
          aria-expanded={open}
        >
          <Menu aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="fg-navigation-drawer">
        <DialogHeader>
          <DialogTitle className="sr-only">花园导航</DialogTitle>
          <DialogDescription className="sr-only">
            选择要前往的页面，或按 Escape 关闭导航。
          </DialogDescription>
        </DialogHeader>
        <Brand />
        <Navigation onNavigate={() => setOpen(false)} />
        <p className="fg-drawer-note">一点专注，一点生长。</p>
      </DialogContent>
    </Dialog>
  );
};
