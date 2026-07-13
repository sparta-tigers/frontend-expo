// src/features/liveboard/hooks/useLiveboardData.ts
import { fetchMatchRoom } from "@/src/features/match";

import { useQuery } from "@tanstack/react-query";
import { LiveboardMapper } from "../mapper";
import { LiveboardData } from "../types";

/**
 * 🛰️ useLiveboardData: 특정 경기의 실시간 중계 데이터를 조회하는 Hook
 *
 * Why:
 * 1. MatchDetail(정적 정보)과 분리하여 실시간 데이터만 독립적으로 관리함.
 * 2. 컴포넌트 마운트 시 최초 데이터만 로드하며, 이후 업데이트는 WebSocket(STOMP)이 캐시를 갱신함.
 * 3. 비동기 상태 관리를 정돈하여 불필요한 HTTP Polling 오버헤드를 제거함.
 */
export const useLiveboardData = (matchId: number) => {
  return useQuery<LiveboardData>({
    queryKey: ["liveboard", "data", matchId],
    queryFn: async (): Promise<LiveboardData> => {
      try {
        const room = await fetchMatchRoom(matchId);

        if (!room) {
          throw new Error(
            `[useLiveboardData] Room not found for ID: ${matchId}`,
          );
        }

        return LiveboardMapper.toLiveboardData(room);
      } catch (error) {
        throw error;
      }
    },
    staleTime: 1000 * 30, // 🛰️ 30초 내에서는 캐시 신선도 유지
    refetchInterval: 1000 * 60, // 🚨 WebSocket 장애 대비 저빈도(60초) 폴링 백업
    enabled: !!matchId,
  });
};
