import { apiClient } from "@/src/core/client";
import { ApiResponse } from "@/src/shared/types/common";
import { MatchScheduleResponse, TeamRankingResponse, LeagueType, MatchRoomDto } from "./types";

/**
 * 전구단 라이브보드 룸(경기 상세) 목록 조회
 */
export const fetchMatchRooms = async (): Promise<MatchRoomDto[]> => {
  const response = await apiClient.get<ApiResponse<MatchRoomDto[]>>(`/api/live-boards/rooms`);
  return response.data ?? [];
};

/**
 * 특정 날짜 기준 누적 순위 조회
 * @param date yyyyMMdd 형식의 문자열
 */
export const fetchDailyRanking = async (date: string, leagueType: LeagueType): Promise<TeamRankingResponse> => {
  return await apiClient.get<TeamRankingResponse>(`/api/rankings/daily`, { anyday: date, leagueType });
};

/**
 * 연도별 시즌 순위 조회
 * @param year 시즌 연도
 * @param type 리그 종류
 */
export const fetchYearlyRanking = async (year: number, type: LeagueType): Promise<TeamRankingResponse> => {
  return await apiClient.get<TeamRankingResponse>(`/api/rankings/yearly`, { year, leagueType: type });
};

/**
 * 특정 팀의 월별 경기 일정 조회
 */
export const fetchMatchSchedule = async (
  teamId: string,
  year: number,
  month: number,
  leagueType?: LeagueType
): Promise<MatchScheduleResponse> => {
  return await apiClient.get<MatchScheduleResponse>(`/api/matches/schedule`, {
    teamId,
    year,
    month,
    leagueType,
  });
};
