import { useQuery } from "@tanstack/react-query";
import { fetchMatchScheduleAPI } from "../api";
import { TeamCode } from "@/src/utils/team";

/**
 * 경기 일정 조회 커스텀 훅
 * 
 * Why: 도메인 중심 설계에 따라 Match 피처에서 공통 관리함.
 * 연/월 또는 응원팀이 변경될 때마다 자동으로 데이터를 패칭하고 캐싱함.
 * 
 * @param year   조회 연도
 * @param month  조회 월
 * @param teamId 현재 선택된 응원팀 코드 (반응성 보장용)
 */
export const useMatchSchedule = (year: number, month: number, teamId: TeamCode | null) => {
  return useQuery({
    // 🚨 [Structure] 계층적 쿼리 키 적용
    // Why: ['matches', 'schedule'] 프리픽스를 통해 팀 변경 시 특정 팀만 날리거나 전체 무효화 가능.
    queryKey: ["matches", "schedule", { teamId, year, month }],
    queryFn: async () => {
      const response = await fetchMatchScheduleAPI(year, month);
      
      if (response.resultType === "SUCCESS") {
        return response.data;
      }
      
      throw new Error(response.message || "경기 일정을 불러오는데 실패했습니다.");
    },
    // 일정 데이터는 자주 변경되지 않으므로 5분간 신선도 유지
    staleTime: 1000 * 60 * 5,
  });
};
