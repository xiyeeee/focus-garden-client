import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthProvider";
import { AuthStatus } from "./AuthStatus";
export const RequireAuth = () => {
  const { status, retry } = useAuth();
  if (status === "checking") return <AuthStatus onRetry={retry} />;
  if (status === "error") return <AuthStatus failed onRetry={retry} />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  return <Outlet />;
};
