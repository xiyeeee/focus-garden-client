import type { AuthService } from "@/features/auth/auth-types";
import { authApi } from "./auth/api";
export const authService: AuthService = {
  getSession: authApi.getSession,
  login: authApi.login,
  logout: authApi.logout,
};
