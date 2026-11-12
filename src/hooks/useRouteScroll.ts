import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

export const useRouteScroll = () => {
  const scrollRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pathname]);
  return scrollRef;
};
