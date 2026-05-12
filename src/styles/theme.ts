/**
 * 통합 디자인 시스템 (Single Source of Truth)
 *
 * Phase 6: Design System Normalization & Debt Eradication
 * 모든 디자인 토큰을 단일 theme 객체로 통합
 */

import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 🚨 앙드레 카파시: 대시보드 레이아웃 고정 상수 정의
// Why: 계산식에서 중복 참조되는 값을 변수로 추출하여 undefined 방지 및 가독성 확보
const DASHBOARD_PADDING_HORIZONTAL = 30;
const CALENDAR_WIDTH = SCREEN_WIDTH - DASHBOARD_PADDING_HORIZONTAL * 2;

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const LIGHT_THEME = {
  background: "#FFFFFF",
  surface: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  border: "#E5E7EB",
  primary: "#3B82F6",
  secondary: "#6B7280",
  accent: "#10B981",
  destructive: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  success: "#10B981",
  muted: "#6B7280",
  overlay: "rgba(0, 0, 0, 0.5)",
  tint: tintColorLight,
} as const;

export const DARK_THEME = {
  background: "#111827",
  surface: "#1F2937",
  card: "#1F2937",
  text: "#F9FAFB",
  border: "#374151",
  primary: "#2563EB",
  secondary: "#9CA3AF",
  accent: "#059669",
  destructive: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
  success: "#059669",
  muted: "#9CA3AF",
  overlay: "rgba(0, 0, 0, 0.7)",
  tint: tintColorDark,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
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

export type ThemePalette = {
  background: string;
  surface: string;
  card: string;
  text: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  destructive: string;
  warning: string;
  info: string;
  success: string;
  muted: string;
  overlay: string;
  tint: string;
};

export type ColorSchemeName = "light" | "dark";

export const getThemeColors = (scheme: ColorSchemeName): ThemePalette =>
  scheme === "dark" ? DARK_THEME : LIGHT_THEME;

export const theme = {
  colors: {
    primary: "#000000", // 메인 검정
    background: "#FFFFFF", // 기본 배경
    surface: "#F9FAFB", // 카드/입력창 배경 (gray-50)
    card: "#FFFFFF", // 카드 배경
    /**
     * 브랜드/제품 고유 컬러 토큰
     *
     * Why: Figma에서 정의된 앱 고유 색상(민트, 회색 계열, 로그인 그라데이션 등)을
     * 화면 단위에서 하드코딩하지 않고 theme로 끌어올려 단일 출처(SSOT)로 관리한다.
     */
    brand: {
      mint: "#4BBDBD",
      /** 선택 상태 배경(라이브보드 날짜 등) — 민트의 10% 투명도 헥사값 */
      mintAlpha10: "#4BBDBD1A",
      /** 선택 상태 배경(라이브보드 날짜 등) — 민트의 밝은 파생 톤 */
      mintLight: "#DCF5F2",
      background: "#F8F8FA",
      subtitle: "#919191",
      inactive: "#ADADAD",
      /**
       * 로그인 배경 그라데이션(아래 → 위 방향)
       *
       * Why: React Native에서는 CSS의 각도 그라데이션을 그대로 재현하기 어렵다.
       * 앱에서는 시각적 인상이 크게 달라지지 않는 범위에서 스톱 기반으로 근사한다.
       */
      loginGradientStops: [
        "rgba(75, 189, 189, 0.39)",
        "rgba(255, 255, 255, 0.39)",
        "rgba(165, 222, 222, 0.39)",
      ],
    },
    /**
     * 도메인(야구/팀) 전용 컬러
     *
     * Why: 대시보드(`main_0`)에서 팀 컬러(예: KIA 레드)를 화면에서 하드코딩하지 않고
     * 타입 안정성과 재사용성을 확보하기 위해 theme로 승격한다.
     */
    /**
     * KBO 10개 구단 + 공통 뉴트럴 컬러
     *
     * Why: 라이브보드/스케줄/대시보드 등 다수 화면에서 팀 컬러를 참조.
     * 각 화면에서 하드코딩하면 유지보수 불가 → SSOT로 승격.
     */
    team: {
      kia: "#EA0029",
      kiaRed: "#EA0029", // 기존 호환 별칭
      hanwha: "#FF6600",
      lg: "#C30452",
      lotte: "#041E42",
      samsung: "#074CA1",
      nc: "#315288",
      ssg: "#CE0E2D",
      doosan: "#131230",
      kt: "#000000",
      kiwoom: "#820024",
      neutralDark: "#33363F",
      neutralLight: "#D6D6D6",
      /** 팀 매칭 실패 시 기본 컬러 */
      fallback: "#888888",
    },
    /**
     * 대시보드(`main_0`) 전용 톤 컬러
     *
     * Why: 카드 배경 톤(rgba)을 화면에서 직접 쓰면 추적/교체가 어렵다.
     * theme로 승격해 한 곳에서 관리한다.
     */
    dashboard: {
      statTonePink: "rgba(234, 0, 41, 0.12)",
      statToneYellow: "rgba(245, 158, 11, 0.18)",
      statToneGreen: "rgba(16, 185, 129, 0.18)",
      statIconPink: "#EA0029",
      statIconYellow: "#F59E0B",
      statIconGreen: "#10B981",
    },
    /**
     * 라이브보드(`match_detail`) 전용 시각화 컬러
     *
     * Why: 경기장 배경, 점수판, BSO 신호등 등 도메인 특화 색상을
     * 화면에서 하드코딩하지 않고 SSOT로 관리하여 일관성을 유지한다.
     */
    liveboard: {
      stadiumBg: "#2F5D3F",
      scoreAway: "rgba(87,5,20,0.7)",
      scoreHome: "rgba(234,0,41,0.7)",
      countBoxBg: "rgba(255,255,255,0.38)",
      baseIdle: "rgba(78,78,78,0.85)",
      baseActive: "rgba(247,247,247,0.85)",
      bsoDotIdle: "rgba(255,255,255,0.3)",
      bsoBall: "#4CAF50",
      bsoStrike: "#FFC107",
      bsoOut: "#F44336",
      defender: "#277F7F",
      batter: "#333333",
      runner: "rgba(255,255,255,0.92)",
      runnerText: "#333333",
    },
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
    destructive: "#EF4444",
    info: "#3B82F6",
    transparent: "transparent",
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    xxxxl: 50,
    // 기존 호환성을 위한 별칭
    TINY: 4,
    SMALL: 8,
    COMPONENT: 12,
    CARD: 16,
    SECTION: 20,
    SCREEN: 20,
    SCREEN_DASHBOARD: DASHBOARD_PADDING_HORIZONTAL,
    AUTH_TAB: 13,
  },
  typography: {
    size: {
      xxs: 11,
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
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
      extrabold: "800",
      black: "900",
    },
  },
  radius: {
    xxs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    tabBar: 15,
    dashboardCard: 10,
    full: 9999,
    round: 9999,
    // 기존 호환성을 위한 별칭
    BUTTON: 6,
    INPUT: 8,
    IMAGE: 8,
    CARD: 8,
    calendar: 13,
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
  /**
   * 화면/레이아웃 전용 토큰
   *
   * Why: 특정 화면(예: 로그인 main_00)의 픽셀 기반 스펙을 그대로 쓰되,
   * 컴포넌트 코드에서 숫자 하드코딩을 제거하고 일관성을 유지한다.
   */
  layout: {
    /** 공통 레이아웃 토큰 (3개 이상의 화면에서 재사용) */
    common: {
      /** 표준 리스트 아이템 높이 (교환 아이템, 랭킹 카드 등) */
      standardItemHeight: 52,
      /** 대시보드/교환 등 주요 화면 헤더 타이틀 크기 */
      headerTitleSize: 24,
      /** 하단 고정 버튼이 있는 스크롤 뷰의 최하단 패딩 */
      bottomPadding: 100,
    },
    /** 전역 헤더 레이아웃 토큰 */
    auth: {
      headerHeight: 80,
      headerIconBox: 24,
      bodyPaddingHorizontal: 66,
      bodyPaddingVertical: 86,
      logoWidth: 270,
      logoHeight: 274,
      inputHeight: 36,
      socialButtonSize: 45,
      socialIconSize: 30,
      socialDividerHeight: 95,
      tabBarHeight: 66,
      tabBarPaddingVertical: 13,
      tabLabelWidth: 54,
    },
    dashboard: {
      screenPaddingHorizontal: DASHBOARD_PADDING_HORIZONTAL,
      sectionGap: 60,
      sectionTitleHeight: 24,
      myTeamCardHeight: 118,
      myTeamMiniCardSize: 66,
      myTeamMiniCardHeight: 61,
      myTeamMascotBox: 72,
      rankingRowHeight: 25,
      rankingRowHeightActive: 37,
      rankingMyTeamBorderWidth: 2,
      lineupRowWidth: CALENDAR_WIDTH * 0.7, // 고정 234px 대신 캘린더 너비의 70%로 반응형 대응
      lineupRowHeight: 30,
      calendarWidth: CALENDAR_WIDTH,
      calendarCellWidth: Math.floor(CALENDAR_WIDTH / 7), // 7등분 후 정수화
      calendarHeaderHeight: 32,
      calendarCellHeight: 61,
      calendarRadius: 13, // 12.687 반올림; 정수화하여 렌더링 일관성 확보
      matchListBottomPadding: 40,
      activeOpacity: 0.7,
    },
    header: {
      backIconSize: 36,
      titleFontSize: 22,
      profileIconSize: 28,
      standardHeight: 60,
    },
    tabBar: {
      badgeSize: 8,
      badgeOffset: -2,
      badgeRadius: 4,
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
