import type { UserVO } from "@/services/auth/types";
import type { LoginCredentials } from "./login-form";
export interface AuthSession {
  user: UserVO;
}
export interface AuthService {
  getSession: () => Promise<AuthSession | null>;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
}
