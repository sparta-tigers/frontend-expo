import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";

/**
 * 통합 디자인 시스템
 *
 * layout.ts와 responsive.ts를 통합하여 단일 진실 공급원(SSOT) 구축
 * 앙드레 카파시의 '최소한의 코드'와 디터 람스의 '덜, 더 나은' 철학 적용
 */

// 기본 디자인 토큰 (변하지 않는 기준값)
const BASE_DESIGN_TOKENS = {
  SPACING: {
    SCREEN: 20,
    SECTION: 20,
    CARD: 16,
    COMPONENT: 12,
    SMALL: 8,
    TINY: 4,
  },
  BORDER_RADIUS: {
    CARD: 8,
    BUTTON: 6,
    INPUT: 8,
    IMAGE: 8,
  },
  FONT_SIZE: {
    TITLE: 28,
    SECTION_TITLE: 20,
    CARD_TITLE: 18,
    BODY: 16,
    SMALL: 14,
    CAPTION: 12,
  },
  SHADOW: {
    CARD: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    BUTTON: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
  },
} as const;

// 디바이스 타입 판별 함수
const getDeviceType = (width: number) => ({
  isSmallPhone: width < 375, // iPhone SE, 기타 소형폰
  isRegularPhone: width >= 375 && width < 414, // iPhone 12/13/14
  isLargePhone: width >= 414, // iPhone 12/13/14 Plus, Max
  isTablet: width >= 768, // iPad, 안드로이드 태블릿
  isIOS: Platform.OS === "ios",
  isAndroid: Platform.OS === "android",
});

// 디바이스별 배수 계산
const getDeviceMultiplier = (width: number) => {
  const deviceType = getDeviceType(width);

  if (deviceType.isTablet) return 1.6; // 태블릿: 60% 증가
  if (deviceType.isLargePhone) return 1.2; // 대형폰: 20% 증가
  if (deviceType.isSmallPhone) return 0.8; // 소형폰: 20% 감소
  return 1.0; // 표준폰: 기본값
};

/**
 * 반응형 디자인 훅
 *
 * useWindowDimensions를 사용하여 성능 최적화
 * 화면 크기 변경 시에만 재계산
 */
export function useUnifiedDesign() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const multiplier = getDeviceMultiplier(width);
    const deviceType = getDeviceType(width);

    // 동적 디자인 토큰 계산
    const spacing = Object.fromEntries(
      Object.entries(BASE_DESIGN_TOKENS.SPACING).map(([key, value]) => [
        key,
        Math.round(value * multiplier),
      ]),
    );

    const fontSize = Object.fromEntries(
      Object.entries(BASE_DESIGN_TOKENS.FONT_SIZE).map(([key, value]) => [
        key,
        Math.round(value * multiplier),
      ]),
    );

    return {
      // 기본 토큰 (변경 없음)
      BORDER_RADIUS: BASE_DESIGN_TOKENS.BORDER_RADIUS,
      SHADOW: BASE_DESIGN_TOKENS.SHADOW,

      // 반응형 토큰
      SPACING: spacing,
      FONT_SIZE: fontSize,

      // 디바이스 정보
      deviceInfo: {
        width,
        height,
        multiplier,
        ...deviceType,
      },
    };
  }, [width, height]);
}

/**
 * 간편한 접근을 위한 유틸리티 함수
 */
export const getUnifiedDesign = async () => {
  // 서버사이드 렌더링이나 훅 외부에서 사용할 경우
  const { Dimensions } = await import("react-native");
  const { width } = Dimensions.get("window");
  const multiplier = getDeviceMultiplier(width);

  return {
    SPACING: BASE_DESIGN_TOKENS.SPACING,
    BORDER_RADIUS: BASE_DESIGN_TOKENS.BORDER_RADIUS,
    FONT_SIZE: BASE_DESIGN_TOKENS.FONT_SIZE,
    SHADOW: BASE_DESIGN_TOKENS.SHADOW,
    DEVICE_MULTIPLIER: multiplier,
  };
};

// 기본값 export (하위 호환성)
export const SPACING = BASE_DESIGN_TOKENS.SPACING;
export const BORDER_RADIUS = BASE_DESIGN_TOKENS.BORDER_RADIUS;
export const FONT_SIZE = BASE_DESIGN_TOKENS.FONT_SIZE;
export const SHADOW = BASE_DESIGN_TOKENS.SHADOW;
