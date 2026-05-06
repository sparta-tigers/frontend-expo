import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { initializeTokenCache } from "@/src/utils/tokenStore";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode, useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

/**
 * 결합된 Provider 컴포넌트
 *
 * 여러 Provider를 하나로 묶어 컴포넌트 트리 깊이를 최소화
 * 앙드레 카파시의 '최소한의 코드' 철학 적용
 */
export function CombinedProvider({ children }: { children: ReactNode }) {
  // 🚨 React Query Client 생성
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5분
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  // 🚨 앱 시작 시 토큰 캐시 초기화 및 React Query 포커스 관리 설정
  useEffect(() => {
    initializeTokenCache();

    // 🚨 앙드레 카파시: 전역 포커스 매니저 설정 (AppState 연동)
    // Why: 앱이 포그라운드로 돌아올 때 stale 쿼리를 자동으로 refetch 하도록 함
    const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (Platform.OS !== "web") {
        focusManager.setFocused(status === "active");
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
