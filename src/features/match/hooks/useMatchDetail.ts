import { useQuery } from "@tanstack/react-query";
import { matchKeys } from "../queries";
import { fetchLiveBoardRooms } from "@/src/features/liveboard/api";
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
      // NOTE: 현재 단일 경기 상세 조회 API가 없으므로 목록에서 필터링함.
      // 백엔드 API 확충 시 해당 엔드포인트로 교체 권장.
      const rooms = await fetchLiveBoardRooms();
      const room = rooms.find((r) => r.matchId === matchId);
      
      if (!room) {
        throw new Error("경기 정보를 찾을 수 없습니다.");
      }
      
      // MatchDetail 모델로 변환 (TeamMeta 바인딩 포함)
      return MatchMapper.toDetail(room);
    },
    staleTime: 1000 * 30, // 상세 정보는 30초 정도의 신선도 유지
    enabled: !!matchId,
  });
};
