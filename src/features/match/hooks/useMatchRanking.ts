import { useQuery } from "@tanstack/react-query";
import { fetchDailyRanking, fetchYearlyRanking } from "../api";
import { LeagueType } from "../types";

/**
 * 팀 순위 데이터 조회를 위한 커스텀 훅
 * 
 * Why: 연도별/일자별 순위 데이터를 TanStack Query로 관리하여 캐싱 및 최적화된 리렌더링 제공.
 * Query Key Taxonomy: ['ranking', viewMode, { filters }] 구조를 사용하여 엄격하게 계층화함.
 */
export const useMatchRanking = (params: {
  viewMode: "year" | "day";
  year?: number;
  leagueType?: LeagueType;
  date?: string; // yyyyMMdd
}) => {
  const { viewMode, year, leagueType, date } = params;

  return useQuery({
    queryKey: viewMode === "year" 
      ? ["ranking", "yearly", { year, leagueType }] 
      : ["ranking", "daily", { date, leagueType }],
    queryFn: async () => {
      if (viewMode === "year") {
        if (!year || !leagueType) throw new Error("Year and LeagueType are required for yearly ranking");
        return fetchYearlyRanking(year, leagueType);
      } else {
        if (!date || !leagueType) throw new Error("Date and LeagueType are required for daily ranking");
        return fetchDailyRanking(date, leagueType);
      }
    },
    enabled: viewMode === "year" 
      ? (!!year && !!leagueType) 
      : (!!date && !!leagueType),
    staleTime: 1000 * 60 * 5, // 5분 캐싱
  });
};
