import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exchangeGetMyRequestsAPI, exchangeUpdateStatusAPI } from "../api";
import { ExchangeRequestStatus } from "../types";

/**
 * 🚨 앙드레 카파시: React Query를 이용한 교환 요청 목록 관리 및 상태 업데이트 훅
 * 
 * Why: 수동 useState/useEffect 관리로 인한 중복 호출 및 캐시 불일치 문제 해결.
 * 캐싱, 자동 로딩 상태 관리, 윈도우 포커스 시 자동 갱신 기능을 활용함.
 *
 * @param role - "receiver" (받은 요청) | "sender" (보낸 요청)
 */
export const useExchangeRequests = (role: "receiver" | "sender") => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["exchangeRequests", role],
    queryFn: () => exchangeGetMyRequestsAPI(role, 0, 50),
    staleTime: 1000 * 30, // 30초 동안은 캐시된 데이터 사용
  });

  const requests = data?.data?.content ?? [];

  // 🚨 앙드레 카파시: 상태 변경 Mutation
  // onSuccess 시 ["exchangeRequests"] 키를 무효화하여 보낸/받은 목록 모두를 최신화함
  const { mutateAsync: handleAccept } = useMutation({
    mutationFn: async (id: number) => {
      const response = await exchangeUpdateStatusAPI(id, {
        status: ExchangeRequestStatus.ACCEPTED,
      });
      if (response.resultType !== "SUCCESS") {
        throw new Error(response.error?.message || "수락 처리 실패");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeRequests"] });
    },
  });

  const { mutateAsync: handleReject } = useMutation({
    mutationFn: async (id: number) => {
      const response = await exchangeUpdateStatusAPI(id, {
        status: ExchangeRequestStatus.REJECTED,
      });
      if (response.resultType !== "SUCCESS") {
        throw new Error(response.error?.message || "거절 처리 실패");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeRequests"] });
    },
  });

  return {
    requests,
    loading: isLoading,
    refreshing: isRefetching,
    error: error instanceof Error ? error.message : null,
    fetchRequests: refetch,
    handleRefresh: refetch,
    handleAccept,
    handleReject,
  };
};
