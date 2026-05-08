import { useQuery } from "@tanstack/react-query";
import { fetchMatchSchedule } from "../api";
import { TeamCode } from "@/src/utils/team";
import { LeagueType } from "../types";

/**
 * 경기 일정 조회 커스텀 훅
 * 
 * Why: 도메인 중심 설계에 따라 Match 피처에서 공통 관리함.
 * 연/월, 리그 타입 또는 응원팀이 변경될 때마다 자동으로 데이터를 패칭하고 캐싱함.
 * 
 * @param year       조회 연도
 * @param month      조회 월
 * @param teamId     현재 선택된 응원팀 코드
 * @param leagueType 리그 종류 (REGULAR, PRESEASON, POST_SEASON)
 */
export const useMatchSchedule = (
  year: number, 
  month: number, 
  teamId: TeamCode | null, 
  leagueType?: LeagueType
) => {
  return useQuery({
    queryKey: ["matches", "schedule", { teamId, year, month, leagueType }],
    queryFn: async () => {
      if (!teamId) throw new Error("팀 정보가 없습니다.");
      const response = await fetchMatchSchedule(teamId, year, month, leagueType);
      
      if (response.resultType === "SUCCESS") {
        return response.data;
      }
      
      throw new Error(response.message || "경기 일정을 불러오는데 실패했습니다.");
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!teamId,
  });
};
