"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authApi, getStoredAuth, setStoredAuth } from "./api";
import { AuthResponse, Role } from "./types";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  clubName?: string;
  clubDescription?: string;
  clubContactEmail?: string;
}

interface AuthContextValue {
  user: AuthResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Must run post-mount, not as a lazy initializer: localStorage is unavailable
    // during SSR, and reading it synchronously on the client's first render would
    // mismatch the server-rendered (null) HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(getStoredAuth());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await authApi.login({ email, password });
    setStoredAuth(auth);
    setUser(auth);
    return auth;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const auth = await authApi.register(payload);
    setStoredAuth(auth);
    setUser(auth);
    return auth;
  }, []);

  const logout = useCallback(() => {
    setStoredAuth(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
