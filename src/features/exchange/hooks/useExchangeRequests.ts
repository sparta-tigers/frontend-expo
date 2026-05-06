import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
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

  const [manualRefreshing, setManualRefreshing] = useState(false);

  // 🚨 앙드레 카파시: 수동 새로고침 핸들러
  // Why: 자동 배경 refetch 시 스피너가 도는 것을 방지하고, 수동 조작 시에만 시각적 피드백 제공
  const handleRefresh = useCallback(async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  }, [refetch]);

  return {
    requests,
    loading: isLoading,
    refreshing: manualRefreshing,
    error: error instanceof Error ? error.message : null,
    fetchRequests: refetch,
    handleRefresh,
    handleAccept,
    handleReject,
  };
};
