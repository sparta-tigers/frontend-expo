import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchMatchSchedule } from "../api";
import { TeamCode } from "@/src/utils/team";
import { LeagueType } from "../types";

/**
 * 경기 일정 조회 커스텀 훅
 * 
 * Why: 도메인 중심 설계에 따라 Match 피처에서 공통 관리함.
 * placeholderData를 사용하여 월 이동 시 깜빡임을 방지하고 부드러운 UX 제공.
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
    placeholderData: keepPreviousData, // v5: 이전 데이터를 유지하여 깜빡임 방지
  });
};
