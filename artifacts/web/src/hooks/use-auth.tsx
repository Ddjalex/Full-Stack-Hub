import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("auth_token_changed"));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("auth_token_changed"));
}

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => {
      setTokenState(getToken());
    };
    window.addEventListener("auth_token_changed", handler);
    return () => window.removeEventListener("auth_token_changed", handler);
  }, []);

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: 1000 * 60 * 5,
    },
  });

  const setUserCache = useCallback(
    (userData: typeof user) => {
      queryClient.setQueryData(getGetMeQueryKey(), userData);
    },
    [queryClient]
  );

  return {
    user: token ? user : null,
    isLoading: !!token && isLoading,
    isAuthenticated: !!token && !!user,
    token,
    setUserCache,
  };
}
