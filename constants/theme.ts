/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const LIGHT_THEME = {
  /** 배경색 */
  background: "#FFFFFF",
  /** 서피스 색상 */
  surface: "#F9FAFB",
  /** 카드 배경색 */
  card: "#FFFFFF",
  /** 기본 텍스트 색상 */
  text: "#111827",
  /** 테두리 색상 */
  border: "#E5E7EB",
  /** 주요 색상 */
  primary: "#3B82F6",
  /** 보조 색상 */
  secondary: "#6B7280",
  /** 액센트 색상 */
  accent: "#10B981",
  /** 파괴 색상 */
  destructive: "#EF4444",
  /** 경고 색상 */
  warning: "#F59E0B",
  /** 정보 색상 */
  info: "#3B82F6",
  /** 성공 색상 */
  success: "#10B981",
  /** 뮤트된 텍스트 색상 */
  muted: "#6B7280",
  /** 오버레이 색상 */
  overlay: "rgba(0, 0, 0, 0.5)",
  /** 탭 틴트 색상 */
  tint: tintColorLight,
} as const;

export const DARK_THEME = {
  /** 배경색 */
  background: "#111827",
  /** 서피스 색상 */
  surface: "#1F2937",
  /** 카드 배경색 */
  card: "#1F2937",
  /** 기본 텍스트 색상 */
  text: "#F9FAFB",
  /** 테두리 색상 */
  border: "#374151",
  /** 주요 색상 */
  primary: "#2563EB",
  /** 보조 색상 */
  secondary: "#9CA3AF",
  /** 액센트 색상 */
  accent: "#059669",
  /** 파괴 색상 */
  destructive: "#DC2626",
  /** 경고 색상 */
  warning: "#D97706",
  /** 정보 색상 */
  info: "#2563EB",
  /** 성공 색상 */
  success: "#059669",
  /** 뮤트된 텍스트 색상 */
  muted: "#9CA3AF",
  /** 오버레이 색상 */
  overlay: "rgba(0, 0, 0, 0.7)",
  /** 탭 틴트 색상 */
  tint: tintColorDark,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type ThemeColors = typeof LIGHT_THEME;
