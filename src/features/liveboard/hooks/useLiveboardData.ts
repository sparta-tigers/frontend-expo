// src/features/liveboard/hooks/useLiveboardData.ts
import { fetchMatchRoom } from "@/src/features/match";
import { Logger } from "@/src/utils/logger";
import { useQuery } from "@tanstack/react-query";
import { LiveboardMapper } from "../mapper";
import { LiveboardData } from "../types";

/**
 * 🛰️ useLiveboardData: 특정 경기의 실시간 중계 데이터를 조회하는 Hook
 * 
 * Why: 
 * 1. MatchDetail(정적 정보)과 분리하여 실시간 데이터만 독립적으로 관리함.
 * 2. 컴포넌트 마운트 즉시 병렬 패칭(No Waterfall)을 보장함.
 * 3. 향후 WebSocket이나 폴링(Polling) 전략을 이 훅 내부에서만 교체할 수 있음.
 */
export const useLiveboardData = (matchId: number) => {
  return useQuery<LiveboardData>({
    queryKey: ["liveboard", "data", matchId],
    queryFn: async (): Promise<LiveboardData> => {
      try {
        const room = await fetchMatchRoom(matchId);
        
        if (!room) {
          throw new Error(`[useLiveboardData] Room not found for ID: ${matchId}`);
        }

        return LiveboardMapper.toLiveboardData(room);
      } catch (error) {
        Logger.error(`[useLiveboardData] Failed to fetch live data (ID: ${matchId})`, error);
        throw error;
      }
    },
    staleTime: 1000 * 30, // 🛰️ 30초 폴링 주기와 일치시켜 주기 내에서는 캐시 신선도 유지
    refetchInterval: 1000 * 30, // 30초마다 자동 폴링
    enabled: !!matchId,
  });
};
