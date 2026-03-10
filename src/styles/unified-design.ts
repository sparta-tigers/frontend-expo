import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";

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
  isSmallPhone: width < 375,
  isRegularPhone: width >= 375 && width < 414,
  isLargePhone: width >= 414,
  isTablet: width >= 768,
  isIOS: Platform.OS === "ios",
  isAndroid: Platform.OS === "android",
});

// 디바이스별 배수 계산
const getDeviceMultiplier = (width: number) => {
  const deviceType = getDeviceType(width);

  if (deviceType.isTablet) return 1.6;
  if (deviceType.isLargePhone) return 1.2;
  if (deviceType.isSmallPhone) return 0.8;
  return 1.0;
};

export type UnifiedDesign = {
  BORDER_RADIUS: typeof BASE_DESIGN_TOKENS.BORDER_RADIUS;
  SHADOW: typeof BASE_DESIGN_TOKENS.SHADOW;
  SPACING: Record<keyof typeof BASE_DESIGN_TOKENS.SPACING, number>;
  FONT_SIZE: Record<keyof typeof BASE_DESIGN_TOKENS.FONT_SIZE, number>;
  deviceInfo: {
    width: number;
    height: number;
    multiplier: number;
  } & ReturnType<typeof getDeviceType>;
};

/**
 * 반응형 디자인 훅
 */
export function useUnifiedDesign(): UnifiedDesign {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const multiplier = getDeviceMultiplier(width);
    const deviceType = getDeviceType(width);

    const spacing = Object.fromEntries(
      Object.entries(BASE_DESIGN_TOKENS.SPACING).map(([key, value]) => [
        key,
        Math.round(value * multiplier),
      ]),
    ) as UnifiedDesign["SPACING"];

    const fontSize = Object.fromEntries(
      Object.entries(BASE_DESIGN_TOKENS.FONT_SIZE).map(([key, value]) => [
        key,
        Math.round(value * multiplier),
      ]),
    ) as UnifiedDesign["FONT_SIZE"];

    return {
      BORDER_RADIUS: BASE_DESIGN_TOKENS.BORDER_RADIUS,
      SHADOW: BASE_DESIGN_TOKENS.SHADOW,
      SPACING: spacing,
      FONT_SIZE: fontSize,
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
 * 훅 외부에서 사용할 경우
 */
export const getUnifiedDesign = async () => {
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

export const SPACING = BASE_DESIGN_TOKENS.SPACING;
export const BORDER_RADIUS = BASE_DESIGN_TOKENS.BORDER_RADIUS;
export const FONT_SIZE = BASE_DESIGN_TOKENS.FONT_SIZE;
export const SHADOW = BASE_DESIGN_TOKENS.SHADOW;
