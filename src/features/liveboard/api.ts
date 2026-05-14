import { apiClient } from "@/src/core/client";
import { MatchLineupDto, MatchWeatherDto } from "./types";


/**
 * 특정 경기의 홈/어웨이 라인업 조회
 *
 * Why: 라이브보드 룸의 "선수 라인업" 탭에서 matchId 기반으로
 * 양 팀 라인업을 한 번에 수신하기 위함.
 *
 * @param matchId 경기 ID
 */
export const fetchMatchLineup = async (
  matchId: string,
): Promise<MatchLineupDto> => {
  return await apiClient.get<MatchLineupDto>(
    `/api/liveboard/${matchId}/lineup`,
  );
};

/**
 * 특정 경기의 구장 날씨(현재 + 시간대별 예보) 조회
 *
 * Why: 라이브보드 룸의 "구장날씨" 탭에서 matchId 기반으로 NowCast + ForeCast를
 * 단일 호출에 수신하기 위함.
 *
 * @param matchId 경기 ID
 */
export const fetchMatchWeather = async (
  matchId: string,
): Promise<MatchWeatherDto> => {
  return await apiClient.get<MatchWeatherDto>(
    `/api/liveboard/${matchId}/weather`,
  );
};
