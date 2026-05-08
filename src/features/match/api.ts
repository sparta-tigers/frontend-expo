import { apiClient } from "@/src/core/client";
import { MatchScheduleResponse, TeamRankingResponse, LeagueType } from "./types";

/**
 * 특정 날짜 기준 누적 순위 조회
 * @param date yyyyMMdd 형식의 문자열
 */
export const fetchDailyRanking = async (date: string): Promise<TeamRankingResponse> => {
  return await apiClient.get<TeamRankingResponse>(`/api/rankings/daily`, { anyday: date });
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
  month: number
): Promise<MatchScheduleResponse> => {
  return await apiClient.get<MatchScheduleResponse>(`/api/matches/schedule`, {
    teamId,
    year,
    month,
  });
};
