import { useQuery } from "@tanstack/react-query";
import { favoriteTeamGetAPI } from "./favorite-team-api";
import { isAxiosError } from "axios";

/**
 * 즐겨찾기 팀 관련 쿼리 키
 */
export const favoriteTeamKeys = {
  all: ["favoriteTeam"] as const,
  mine: () => [...favoriteTeamKeys.all, "mine"] as const,
};

/**
 * 🎯 [Senior Architect] 내 즐겨찾기 팀 조회 훅
 * 
 * Why: 흩어져 있던 즐겨찾기 팀 조회 로직을 TanStack Query로 통합하여
 * 캐싱, 자동 무효화, 그리고 결정론적인 에러 핸들링을 제공함.
 * 레거시(useEffect + useState) 방식을 완전히 대체함.
 */
export const useFavoriteTeam = () => {
  return useQuery({
    queryKey: favoriteTeamKeys.mine(),
    queryFn: async () => {
      try {
        const response = await favoriteTeamGetAPI();
        
        // 🚨 [Zero Magic] 백엔드 ApiResponse 구조 상 
        // 데이터가 없는 경우(404 등)를 명시적으로 null 처리하여 타입 안정성 확보.
        if (response.resultType === "SUCCESS") {
          return response.data ?? null;
        }
        
        return null;
      } catch (error: unknown) {
        // 404 Not Found는 즐겨찾기 팀이 없는 정상 상태로 간주
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        // 그 외의 네트워크 에러 등은 전파하여 호출부에서 처리하게 함
        throw error;
      }
    },
    // 사용자 경험을 위해 기본적으로 팀 정보가 자주 바뀌지 않으므로 캐시 시간 최적화
    staleTime: 1000 * 60 * 5, // 5분
  });
};
