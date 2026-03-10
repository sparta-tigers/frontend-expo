/**
 * 통합 디자인 시스템 (Single Source of Truth)
 *
 * Phase 6: Design System Normalization & Debt Eradication
 * 모든 디자인 토큰을 단일 theme 객체로 통합
 */

export const theme = {
  colors: {
    primary: "#000000", // 메인 검정
    background: "#FFFFFF", // 기본 배경
    surface: "#F9FAFB", // 카드/입력창 배경 (gray-50)
    card: "#FFFFFF", // 카드 배경
    text: {
      primary: "#111827", // 기본 텍스트 (gray-900)
      secondary: "#6B7280", // 보조 텍스트 (gray-500)
      tertiary: "#9CA3AF", // 비활성 텍스트 (gray-400)
    },
    border: {
      light: "#F3F4F6", // 얇은 선 (gray-100)
      medium: "#E5E7EB", // 기본 선 (gray-200)
      dark: "#D1D5DB", // 진한 선 (gray-300)
      bottom: "#e0e0e0",
    },
    // 기존 호환성을 위한 별칭
    muted: "#6B7280", // 보조 텍스트와 동일
    overlay: "rgba(0, 0, 0, 0.5)",
    // 상태 색상
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    // 기존 호환성을 위한 별칭
    TINY: 4,
    SMALL: 8,
    COMPONENT: 12,
    CARD: 16,
    SECTION: 20,
    SCREEN: 20,
  },
  typography: {
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      // 기존 호환성을 위한 별칭
      CAPTION: 12,
      SMALL: 14,
      BODY: 16,
      CARD_TITLE: 18,
      SECTION_TITLE: 20,
      TITLE: 28,
    },
    weight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
    // 기존 호환성을 위한 별칭
    BUTTON: 6,
    INPUT: 8,
    IMAGE: 8,
    CARD: 8,
  },
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    button: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
  },
} as const;

// 기존 타입 호환성
export type ThemeColors = typeof theme.colors;

// 기존 상수들 (하위 호환성)
export const SPACING = theme.spacing;
export const BORDER_RADIUS = theme.radius;
export const FONT_SIZE = theme.typography.size;
export const SHADOW = theme.shadow;
