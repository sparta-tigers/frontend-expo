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
  pitcher: { top: "58%", left: "38%" },
  catcher: { top: "84%", left: "38%" },

  // 내야수
  firBase: { top: "61%", left: "67%" },
  secondBase: { top: "46%", left: "58%" },
  thirdBase: { top: "61%", left: "10%" },
  shortstop: { top: "46%", left: "20%" },

  // 외야수
  leftFielder: { top: "33%", left: "8%" },
  centerFielder: { top: "25%", left: "38%" },
  rightFielder: { top: "33%", left: "67%" },

  // 타자 (홈플레이트 근처)
  batter: { top: "78%", left: "46%" },

  // 🏃 주자 위치 추가 (베이스 근처)
  runner1: { top: "65%", left: "73%" },
  runner2: { top: "41%", left: "53%" },
  runner3: { top: "65%", left: "2%" },
} as const;

export type FieldRole = keyof typeof FIELD_POSITIONS;

/**
 * 🏟️ isValidFieldRole: 렌더링 가능한 포지션인지 검증하는 가드 함수
 */
export const isValidFieldRole = (role: string): role is FieldRole => {
  return role in FIELD_POSITIONS;
};
