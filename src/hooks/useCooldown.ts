import { useState } from "react";
import { useNow } from "./useNow";
export const useCooldown = () => {
  const now = useNow();
  const [deadline, setDeadline] = useState({ startedAt: 0, until: 0 });
  return {
    seconds: Math.max(
      0,
      Math.ceil((deadline.until - Math.max(now, deadline.startedAt)) / 1000),
    ),
    start: (seconds: number) => {
      const startedAt = Date.now();
      setDeadline({
        startedAt,
        until: startedAt + Math.max(0, seconds) * 1000,
      });
    },
  };
};
