import { Stack } from 'expo-router';

/**
 * 인증 레이아웃
 * 로그인/회원가입 페이지의 공통 레이아웃 구조
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: true }} />;
}
