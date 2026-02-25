/**
 * 앱 전체의 레이아웃 관련 상수 정의
 * 
 * 일관된 마진과 패딩을 위해 중앙에서 관리하는 상수들
 * 모든 컴포넌트에서 이 상수들을 사용하여 디자인 일관성 유지
 */

export const SPACING = {
  /** 화면 전체 기본 마진 */
  SCREEN: 20,
  /** 섹션 간격 */
  SECTION: 20,
  /** 카드 내부 패딩 */
  CARD: 16,
  /** 컴포넌트 간 기본 간격 */
  COMPONENT: 12,
  /** 작은 간격 */
  SMALL: 8,
  /** 최소 간격 */
  TINY: 4,
} as const;

export const BORDER_RADIUS = {
  /** 카드 및 컨테이너 둥근 모서리 */
  CARD: 8,
  /** 버튼 둥근 모서리 */
  BUTTON: 6,
  /** 입력 필드 둥근 모서리 */
  INPUT: 8,
  /** 이미지 둥근 모서리 */
  IMAGE: 8,
} as const;

export const FONT_SIZE = {
  /** 페이지 제목 */
  TITLE: 28,
  /** 섹션 제목 */
  SECTION_TITLE: 20,
  /** 카드 제목 */
  CARD_TITLE: 18,
  /** 본문 텍스트 */
  BODY: 16,
  /** 작은 텍스트 */
  SMALL: 14,
  /** 캡션 텍스트 */
  CAPTION: 12,
} as const;

export const SHADOW = {
  /** 카드 그림자 */
  CARD: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  /** 버튼 그림자 */
  BUTTON: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
} as const;
