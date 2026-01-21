import { useAuth } from "@/src/hooks/useAuth";
import { Redirect } from "expo-router";

/**
 * 루트 레이아웃
 * 전체 앱의 진입점
 */
export default function RootLayout() {
  const { user, isLoading } = useAuth();

  // 로딩 중이거나 로그인되지 않은 경우 로그인 페이지로
  if (isLoading || !user) {
    return <Redirect href="/(auth)/signin" />;
  }

  return <Redirect href="/(tabs)" />;
}
