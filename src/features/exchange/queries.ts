import { useQuery } from "@tanstack/react-query";
import { checkHasActiveItemAPI } from "./api";

/**
 * 현재 사용자의 활성 아이템 존재 여부를 확인하는 훅
 * React Query를 사용하여 캐싱 및 상태 관리를 최적화함
 */
export const useCheckActiveItem = () => {
  return useQuery({
    queryKey: ["activeItemCheck"],
    queryFn: async () => {
      const response = await checkHasActiveItemAPI();
      if (response.resultType === "SUCCESS") {
        return response.data;
      }
      return false;
    },
    // 자주 바뀌는 정보가 아니므로 적절한 캐시 시간 설정
    staleTime: 1000 * 60 * 5, // 5분
  });
};
