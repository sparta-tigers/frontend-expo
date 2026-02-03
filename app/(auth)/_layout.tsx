import { Redirect } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { Slot } from "expo-router";

/**
 * 인증 레이아웃
 * 로그인/회원가입 페이지의 공통 레이아웃 구조
 */
export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  // 로그인된 경우 메인 앱으로 리다이렉트
  if (user && !isLoading) {
    return <Redirect href="/(tabs)" />;
  }

  // 로그인되지 않은 경우 현재 페이지 렌더링 (signin, signup 등)
  return <Slot />;
}
