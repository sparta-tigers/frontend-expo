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
  all: ["matches"] as const,
  lists: () => [...matchKeys.all, "list"] as const,
  list: (filters: object) => [...matchKeys.lists(), filters] as const,
  details: () => [...matchKeys.all, "detail"] as const,
  detail: (matchId: number, myTeamCode: TeamCode | null) => [...matchKeys.details(), matchId, { myTeamCode }] as const,
  ranking: {
    all: () => [...matchKeys.all, "ranking"] as const,
    yearly: (year: number, type: string) => [...matchKeys.ranking.all(), "yearly", { year, type }] as const,
    daily: (date: string, type: string) => [...matchKeys.ranking.all(), "daily", { date, type }] as const,
  },
  liveboard: {
    all: () => [...matchKeys.all, "liveboard"] as const,
    week: (startDate: string) => [...matchKeys.liveboard.all(), "week", { startDate }] as const,
    rooms: (date: string) => [...matchKeys.liveboard.all(), "rooms", { date }] as const,
    lineup: (matchId: string) => [...matchKeys.liveboard.all(), "lineup", { matchId }] as const,
    weather: (matchId: string) => [...matchKeys.liveboard.all(), "weather", { matchId }] as const,
  },
} as const;
