import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GardenData } from "@/types";
import { gardenService } from "@/services";
interface GardenContextValue {
  data: GardenData | null;
  error: string;
  busy: boolean;
  run: <T>(operation: () => Promise<T>) => Promise<T | undefined>;
  refresh: () => Promise<void>;
}
const GardenContext = createContext<GardenContextValue | null>(null);
export const GardenProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<GardenData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    try {
      setData(await gardenService.read());
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "读取失败");
    }
  }, []);
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    const sync = () => {
      void refresh();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      clearTimeout(initialLoad);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [refresh]);
  const active = data?.sessions.find((session) => session.status === "running");
  useEffect(() => {
    if (!active) return;
    const remaining =
      active.plannedMinutes * 60000 -
      active.actualMs -
      (Date.now() - (active.resumedAt ?? Date.now()));
    const timer = window.setTimeout(
      () => void refresh(),
      Math.max(0, remaining),
    );
    return () => clearTimeout(timer);
  }, [active, refresh]);
  const run = async <T,>(operation: () => Promise<T>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await operation();
      setData(await gardenService.read());
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败，请重试");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <GardenContext.Provider value={{ data, error, busy, run, refresh }}>
      {children}
    </GardenContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components -- provider 与专用 hook 共用上下文。
export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) throw new Error("Missing GardenProvider");
  return context;
};
