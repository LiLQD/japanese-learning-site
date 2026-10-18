import { createContext, useContext } from "react";

export type AuthUser = {
  id: number;
  displayName: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarKey?: string | null;
};

export type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
