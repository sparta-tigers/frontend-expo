import { useQuery } from "@tanstack/react-query";
import { fetchMatchScheduleAPI } from "../api";

/**
 * 경기 일정 조회 커스텀 훅
 * 
 * Why: 도메인 중심 설계에 따라 Match 피처에서 공통 관리함.
 * 연/월이 변경될 때마다 자동으로 데이터를 패칭하고 캐싱함.
 * 
 * @param year  조회 연도
 * @param month 조회 월
 */
export const useMatchSchedule = (year: number, month: number) => {
  return useQuery({
    queryKey: ["match", "schedule", year, month],
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
