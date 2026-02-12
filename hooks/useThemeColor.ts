import { useColorScheme } from "react-native";

/**
 * 테마 색상 훅
 *
 * PWA의 CSS 변수 기반 테마를 React Native로 대체
 * - 다크/라이트 모드 지원
 * - 기본 색상 팔레트 제공
 */
export const useThemeColor = (
  props: { light?: string; dark?: string },
  colorName: keyof typeof colors.light,
) => {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme as keyof typeof props];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return colors[theme][colorName];
  }
};

/**
 * 기본 색상 팔레트
 */
const colors = {
  light: {
    primary: "#3B82F6",
    background: "#FFFFFF",
    card: "#F9FAFB",
    text: "#111827",
    border: "#E5E7EB",
    muted: "#6B7280",
    accent: "#10B981",
    destructive: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    success: "#10B981",
  },
  dark: {
    primary: "#2563EB",
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    border: "#374151",
    muted: "#9CA3AF",
    accent: "#059669",
    destructive: "#DC2626",
    warning: "#D97706",
    info: "#2563EB",
    success: "#059669",
  },
};

export type ColorName = keyof typeof colors.light;
