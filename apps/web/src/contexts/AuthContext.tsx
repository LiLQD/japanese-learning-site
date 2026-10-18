import { useEffect, useState, type ReactNode } from "react";
import { AuthContext, type AuthUser } from "./auth-context";

async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    setUser(await fetchCurrentUser());
    setIsLoading(false);
  }

  async function logout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Đăng xuất thất bại.");
    }

    setUser(null);
  }

  useEffect(() => {
    let active = true;

    void fetchCurrentUser().then((currentUser) => {
      if (!active) return;
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
