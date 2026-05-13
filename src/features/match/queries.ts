import { TeamCode } from "@/src/utils/team";

/**
 * 🔑 matchKeys: Match 도메인 전용 쿼리 키 팩토리
 * 
 * Why: 
 * 1. 문자열 오타로 인한 캐시 불일치 문제를 원천 차단함.
 * 2. as const를 사용하여 엄격한 리터럴 타입 안정성을 보장함.
 * 3. 쿼리 무효화(Invalidation) 시 범위를 계층적으로 관리하기 위함.
 */
export const matchKeys = {
  /** 모든 매치 관련 쿼리의 루트 키 */
  all: ["matches"] as const,

  /** 매치 목록 조회를 위한 베이스 키 */
  lists: () => [...matchKeys.all, "list"] as const,

  /** 필터(날짜, 팀 등)가 포함된 특정 매치 목록 키 */
  list: (filters: object) => [...matchKeys.lists(), filters] as const,

  /** 매치 상세 조회를 위한 베이스 키 */
  details: () => [...matchKeys.all, "detail"] as const,

  /** 
   * 특정 경기 상세 정보 조회를 위한 키
   * Why: 경기 ID뿐만 아니라 사용자의 응원팀 컨텍스트(myTeamCode)를 키에 포함하여, 
   * 팀 변경 시 홈/어웨이 관점이 반영된 상세 데이터를 새롭게 캐싱하도록 보장함.
   */
  detail: (matchId: number, myTeamCode: TeamCode | null) => [...matchKeys.details(), matchId, { myTeamCode }] as const,

  ranking: {
    /** 순위 데이터 조회를 위한 베이스 키 */
    all: () => [...matchKeys.all, "ranking"] as const,

    /** 연간 순위 데이터 키 (기록 종류 포함) */
    yearly: (year: number, type: string) => [...matchKeys.ranking.all(), "yearly", { year, type }] as const,

    /** 일별 순위 데이터 키 (기준 날짜 포함) */
    daily: (date: string, type: string) => [...matchKeys.ranking.all(), "daily", { date, type }] as const,
  },

  liveboard: {
    /** 라이브보드 전용 쿼리의 베이스 키 */
    all: () => [...matchKeys.all, "liveboard"] as const,

    /** 주간 경기 일정 키 */
    week: (startDate: string) => [...matchKeys.liveboard.all(), "week", { startDate }] as const,

    /** 특정 날짜의 라이브보드 경기 목록 키 */
    rooms: (date: string) => [...matchKeys.liveboard.all(), "rooms", { date }] as const,

    /** 특정 경기의 실시간 라인업 데이터 키 */
    lineup: (matchId: string) => [...matchKeys.liveboard.all(), "lineup", { matchId }] as const,

    /** 특정 경기의 구장 날씨 데이터 키 */
    weather: (matchId: string) => [...matchKeys.liveboard.all(), "weather", { matchId }] as const,
  },
} as const;
