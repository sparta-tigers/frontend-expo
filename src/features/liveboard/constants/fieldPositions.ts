// src/features/liveboard/constants/fieldPositions.ts

/**
 * 🏟️ FIELD_POSITIONS: 경기장 내 선수 배치를 위한 절대 좌표 맵
 * 
 * Why: 
 * 1. 백엔드 DTO의 role 값을 Key로 사용하여 Zero Magic 매핑을 실현함.
 * 2. % 단위 좌표를 사용하여 디바이스 크기에 관계없이 일정한 위치를 보장함.
 * 3. 비율은 styles/matchId.styles.ts의 liveSection aspectRatio(기획안 기준)에 의존함.
 */
export const FIELD_POSITIONS = {
  // 투수/포수
  pitcher: { top: "60%", left: "45%" },
  catcher: { top: "85%", left: "45%" },
  
  // 내야수
  firBase: { top: "54%", left: "75%" },
  secondBase: { top: "37%", left: "62%" },
  thirdBase: { top: "54%", left: "15%" },
  shortstop: { top: "37%", left: "28%" },
  
  // 외야수
  leftFielder: { top: "25%", left: "15%" },
  centerFielder: { top: "15%", left: "45%" },
  rightFielder: { top: "25%", left: "75%" },
  
  // 타자 (홈플레이트 근처)
  batter: { top: "82%", left: "60%" },
} as const;

export type FieldRole = keyof typeof FIELD_POSITIONS;

/**
 * 🏟️ isValidFieldRole: 렌더링 가능한 포지션인지 검증하는 가드 함수
 */
export const isValidFieldRole = (role: string): role is FieldRole => {
  return role in FIELD_POSITIONS;
};
