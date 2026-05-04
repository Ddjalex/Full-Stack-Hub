import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useEffect, useState } from "react";

export function useAuth() {
  const token = localStorage.getItem("auth_token");
  
  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false
    }
  });

  return {
    user: token ? user : null,
    isLoading: !!token && isLoading,
    isAuthenticated: !!token && !!user,
    error,
    token
  };
}
