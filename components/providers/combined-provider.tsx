import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { asyncStoragePersister } from "@/src/core/persistence";
import { initializeTokenCache } from "@/src/utils/tokenStore";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
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
            gcTime: 1000 * 60 * 60 * 24, // 24시간 (영속성 데이터 유효 기간)
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
      if (status === "active") {
        if (Platform.OS !== "web") {
          focusManager.setFocused(true);
        }
      } else {
        if (Platform.OS !== "web") {
          focusManager.setFocused(false);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24시간 동안 캐시 유지
      }}
    >
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
