import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import type { Member } from "@workspace/api-client-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  currentMember: Member | null;
  isLoading: boolean;
  login: (token: string, member: Member) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("orodig_token"));
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: member, isLoading: isMemberLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("orodig_token");
      setToken(null);
      setLocation("/");
    }
  }, [isError, setLocation]);

  const handleLogin = (newToken: string, newMember: Member) => {
    localStorage.setItem("orodig_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), newMember);
  };

  const handleLogout = () => {
    localStorage.removeItem("orodig_token");
    setToken(null);
    queryClient.clear();
    setLocation("/");
  };

  const isLoading = !!token && isMemberLoading;

  return (
    <AuthContext.Provider value={{ currentMember: member ?? null, isLoading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
