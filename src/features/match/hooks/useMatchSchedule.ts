import { TeamCode } from "@/src/utils/team";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchMatchSchedule } from "../api";
import { MatchMapper } from "../mapper";
import { matchKeys } from "../queries";
import { LeagueType } from "../types";

/**
 * 경기 일정 조회 커스텀 훅
 *
 * Why: 도메인 중심 설계에 따라 Match 피처에서 공통 관리함.
 * MatchMapper를 도입하여 DTO를 UI 모델(MatchSummary)로 중앙화하여 변환함.
 *
 * @param year       조회 연도
 * @param month      조회 월
 * @param teamId     현재 선택된 응원팀 코드
 * @param leagueType 리그 종류 (REGULAR, PRESEASON, POST_SEASON)
 */
export const useMatchSchedule = (
  year: number,
  month: number,
  teamId: TeamCode | null,
  leagueType?: LeagueType,
) => {
  return useQuery({
    queryKey: matchKeys.list({ teamId, year, month, leagueType }),
    queryFn: async () => {
      if (!teamId) throw new Error("팀 정보가 없어요.");
      const response = await fetchMatchSchedule(
        teamId,
        year,
        month,
        leagueType,
      );

      if (response.resultType === "SUCCESS") {
        // DTO 리스트를 MatchSummary UI 모델 리스트로 변환 (TeamMeta 바인딩)
        return response.data.map((dto) => MatchMapper.toSummary(dto, teamId));
      }

      throw new Error(
        response.message || "경기 일정을 불러오지 못했어요.",
      );
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!teamId,
    placeholderData: keepPreviousData,
  });
};
