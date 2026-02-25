import { Dimensions, Platform } from 'react-native';

/**
 * 디바이스 화면 정보
 */
const { width, height } = Dimensions.get('window');

/**
 * 디바이스 타입 판별
 */
export const DEVICE_TYPE = {
  isSmallPhone: width < 375,      // iPhone SE, 기타 소형폰
  isRegularPhone: width >= 375 && width < 414,  // iPhone 12/13/14
  isLargePhone: width >= 414,      // iPhone 12/13/14 Plus, Max
  isTablet: width >= 768,         // iPad, 안드로이드 태블릿
  isAndroid: Platform.OS === 'android',
  isIOS: Platform.OS === 'ios',
} as const;

/**
 * 반응형 스페이싱 시스템
 * 디바이스 크기에 따라 동적으로 조절되는 마진/패딩
 */
export const RESPONSIVE_SPACING = {
  // 화면 너비 기반 퍼센테이지
  SCREEN_PERCENT: width * 0.05,  // 화면 너비의 5%
  
  // 디바이스별 기본 스페이싱
  SCREEN: DEVICE_TYPE.isTablet ? 32 : 20,
  SECTION: DEVICE_TYPE.isTablet ? 28 : 20,
  CARD: DEVICE_TYPE.isTablet ? 24 : 16,
  COMPONENT: DEVICE_TYPE.isTablet ? 20 : 12,
  SMALL: DEVICE_TYPE.isTablet ? 16 : 8,
  TINY: DEVICE_TYPE.isTablet ? 8 : 4,
  
  // 폰 크기별 조절
  PHONE_SMALL: {
    SCREEN: 16,
    SECTION: 16,
    CARD: 12,
    COMPONENT: 10,
    SMALL: 6,
    TINY: 3,
  },
  PHONE_REGULAR: {
    SCREEN: 20,
    SECTION: 20,
    CARD: 16,
    COMPONENT: 12,
    SMALL: 8,
    TINY: 4,
  },
  PHONE_LARGE: {
    SCREEN: 24,
    SECTION: 24,
    CARD: 20,
    COMPONENT: 16,
    SMALL: 10,
    TINY: 5,
  },
  TABLET: {
    SCREEN: 32,
    SECTION: 28,
    CARD: 24,
    COMPONENT: 20,
    SMALL: 16,
    TINY: 8,
  },
} as const;

/**
 * 현재 디바이스에 맞는 스페이싱 반환
 */
export const getSpacing = () => {
  if (DEVICE_TYPE.isTablet) return RESPONSIVE_SPACING.TABLET;
  if (DEVICE_TYPE.isSmallPhone) return RESPONSIVE_SPACING.PHONE_SMALL;
  if (DEVICE_TYPE.isLargePhone) return RESPONSIVE_SPACING.PHONE_LARGE;
  return RESPONSIVE_SPACING.PHONE_REGULAR;
};

/**
 * 반응형 폰트 크기 시스템
 */
export const RESPONSIVE_FONT_SIZE = {
  // 디바이스별 기본 폰트 크기
  TITLE: DEVICE_TYPE.isTablet ? 32 : 28,
  SECTION_TITLE: DEVICE_TYPE.isTablet ? 24 : 20,
  CARD_TITLE: DEVICE_TYPE.isTablet ? 22 : 18,
  BODY: DEVICE_TYPE.isTablet ? 18 : 16,
  SMALL: DEVICE_TYPE.isTablet ? 16 : 14,
  CAPTION: DEVICE_TYPE.isTablet ? 14 : 12,
  
  // 폰 크기별 조절
  PHONE_SMALL: {
    TITLE: 24,
    SECTION_TITLE: 18,
    CARD_TITLE: 16,
    BODY: 14,
    SMALL: 12,
    CAPTION: 10,
  },
  PHONE_REGULAR: {
    TITLE: 28,
    SECTION_TITLE: 20,
    CARD_TITLE: 18,
    BODY: 16,
    SMALL: 14,
    CAPTION: 12,
  },
  PHONE_LARGE: {
    TITLE: 32,
    SECTION_TITLE: 22,
    CARD_TITLE: 20,
    BODY: 18,
    SMALL: 16,
    CAPTION: 14,
  },
  TABLET: {
    TITLE: 36,
    SECTION_TITLE: 28,
    CARD_TITLE: 24,
    BODY: 20,
    SMALL: 18,
    CAPTION: 16,
  },
} as const;

/**
 * 현재 디바이스에 맞는 폰트 크기 반환
 */
export const getFontSize = () => {
  if (DEVICE_TYPE.isTablet) return RESPONSIVE_FONT_SIZE.TABLET;
  if (DEVICE_TYPE.isSmallPhone) return RESPONSIVE_FONT_SIZE.PHONE_SMALL;
  if (DEVICE_TYPE.isLargePhone) return RESPONSIVE_FONT_SIZE.PHONE_LARGE;
  return RESPONSIVE_FONT_SIZE.PHONE_REGULAR;
};

/**
 * 디바이스 정보 로깅 (개발용)
 */
export const logDeviceInfo = () => {
  console.log('📱 Device Info:', {
    width,
    height,
    platform: Platform.OS,
    type: DEVICE_TYPE.isTablet ? 'Tablet' : 'Phone',
    size: DEVICE_TYPE.isSmallPhone ? 'Small' : 
          DEVICE_TYPE.isLargePhone ? 'Large' : 'Regular',
  });
};
