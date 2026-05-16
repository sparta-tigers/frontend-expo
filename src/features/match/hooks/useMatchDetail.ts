import { useQuery } from "@tanstack/react-query";
import { matchKeys } from "../queries";
import { fetchMatchRoom } from "../api";
import { MatchMapper } from "../mapper";
import { TeamCode } from "@/src/utils/team";


/**
 * 🛰️ useMatchDetail: 특정 경기의 상세 정보를 조회하는 통합 Hook
 * 
 * Why: 
 * 1. 여러 파편화된 경기 정보(날씨, 상태 등)를 MatchDetail UI 모델로 통합하여 제공함.
 * 2. MatchMapper를 통해 TeamMeta가 이미 바인딩된 '완제품' 데이터를 반환함.
 * 3. 중앙화된 matchKeys를 사용하여 캐시 일관성을 유지함.
 * 
 * @param myTeamCode 사용자 응원팀 코드 (컨텍스트)
 */
export const useMatchDetail = (matchId: number, myTeamCode: TeamCode | null) => {
  return useQuery({
    queryKey: matchKeys.detail(matchId, myTeamCode),
    queryFn: async () => {
      try {
        // 🚀 O(1) 단일 조회 API 사용
        const room = await fetchMatchRoom(matchId);
        
        if (!room) {
          throw new Error(`[useMatchDetail] Match not found for ID: ${matchId}`);
        }
        
        return MatchMapper.toDetail(room, myTeamCode ?? undefined);
      } catch (error) {
        throw error;
      }
    },
    staleTime: 1000 * 30, // 상세 정보는 30초 정도의 신선도 유지
    enabled: !!matchId,
  });
};
