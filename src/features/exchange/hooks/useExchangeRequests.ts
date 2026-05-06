import { Logger } from "@/src/utils/logger";
import { useCallback, useEffect, useState } from "react";
import { exchangeGetMyRequestsAPI, exchangeUpdateStatusAPI } from "../api";
import { ExchangeRequestStatus, ReceiveExchangeRequest } from "../types";

/**
 * 교환 요청(받은 것/보낸 것) 목록 관리 및 상태 업데이트를 담당하는 훅
 *
 * @param role - "receiver" (받은 요청) | "sender" (보낸 요청)
 */
export const useExchangeRequests = (role: "receiver" | "sender") => {
  const [requests, setRequests] = useState<ReceiveExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (
      mode: "initial" | "refresh" | "silent" = "initial",
      checkCancelled?: () => boolean,
    ) => {
      try {
        if (mode === "initial") setLoading(true);
        setError(null);
        const response = await exchangeGetMyRequestsAPI(role, 0, 50);

        if (checkCancelled?.()) return;

        if (response.resultType === "SUCCESS" && response.data) {
          setRequests(response.data.content);
        } else {
          throw new Error(
            response.error?.message || "데이터를 불러오는데 실패했습니다.",
          );
        }
      } catch (err) {
        if (checkCancelled?.()) return;
        const msg =
          err instanceof Error ? err.message : "알 수 없는 에러가 발생했습니다.";
        Logger.error(`[useExchangeRequests] ${role} fetch error:`, msg);
        setError(msg);
      } finally {
        if (!checkCancelled?.()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [role],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests("refresh");
  }, [fetchRequests]);

  const handleAccept = useCallback(
    async (id: number) => {
      try {
        const response = await exchangeUpdateStatusAPI(id, {
          status: ExchangeRequestStatus.ACCEPTED,
        });
        if (response.resultType === "SUCCESS") {
          // 상태 업데이트 후 목록 새로고침
          fetchRequests();
        } else {
          throw new Error(
            response.error?.message || "요청 수락에 실패했습니다.",
          );
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "수락 처리 중 에러 발생";
        Logger.error(`[useExchangeRequests] accept error:`, msg);
        throw err; // UI에서 Alert 처리를 위해 throw
      }
    },
    [fetchRequests],
  );

  const handleReject = useCallback(
    async (id: number) => {
      try {
        const response = await exchangeUpdateStatusAPI(id, {
          status: ExchangeRequestStatus.REJECTED,
        });
        if (response.resultType === "SUCCESS") {
          fetchRequests();
        } else {
          throw new Error(
            response.error?.message || "요청 거절에 실패했습니다.",
          );
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "거절 처리 중 에러 발생";
        Logger.error(`[useExchangeRequests] reject error:`, msg);
        throw err;
      }
    },
    [fetchRequests],
  );

  useEffect(() => {
    let cancelled = false;
    const checkCancelled = () => cancelled;

    fetchRequests("initial", checkCancelled);

    return () => {
      cancelled = true;
    };
  }, [fetchRequests]);

  return {
    requests,
    loading,
    refreshing,
    error,
    fetchRequests,
    handleRefresh,
    handleAccept,
    handleReject,
  };
};
