import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { subscribeSessionExpired } from "@/services/http";
import type { AuthSession } from "./auth-types";
import type { LoginSubmit } from "./login-form";
const sessionKey = ["auth", "session"] as const;
interface AuthContextValue {
  status: "checking" | "authenticated" | "anonymous" | "error";
  session: AuthSession | null;
  login: LoginSubmit;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  retry: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: sessionKey,
    queryFn: authService.getSession,
    retry: false,
    staleTime: 60000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
  const status = sessionQuery.isPending
    ? "checking"
    : sessionQuery.isError
      ? "error"
      : sessionQuery.data
        ? "authenticated"
        : "anonymous";
  const clearBusinessCache = useCallback(async () => {
    await queryClient.cancelQueries({
      predicate: (query) => query.queryKey[0] !== "auth",
    });
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== "auth",
    });
    queryClient.getMutationCache().clear();
  }, [queryClient]);
  const clearSession = useCallback(async () => {
    await queryClient.cancelQueries({ queryKey: sessionKey });
    queryClient.setQueryData(sessionKey, null);
    await clearBusinessCache();
  }, [queryClient, clearBusinessCache]);
  useEffect(
    () =>
      subscribeSessionExpired(() => {
        void clearSession();
      }),
    [clearSession],
  );
  useEffect(() => {
    if (sessionQuery.data === null) void clearBusinessCache();
  }, [sessionQuery.data, clearBusinessCache]);
  const login: LoginSubmit = async (credentials) => {
    const session = await authService.login(credentials);
    await queryClient.cancelQueries({ queryKey: sessionKey });
    await clearBusinessCache();
    queryClient.setQueryData(sessionKey, session);
  };
  const logout = async () => {
    await authService.logout();
    await clearSession();
  };
  return (
    <AuthContext.Provider
      value={{
        status,
        session: sessionQuery.data ?? null,
        login,
        logout,
        clearSession,
        retry: () => {
          void sessionQuery.refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components -- 专用 hook 共享认证上下文。
export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("Missing AuthProvider");
  return auth;
};
