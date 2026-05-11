import { apiClient } from "@/src/core/client";
import { LiveBoardRoomDto, MatchLineupDto, MatchWeatherDto } from "./types";

/**
 * 특정 날짜의 라이브보드 방 목록 조회
 * @param anyday yyyyMMdd 형식의 날짜 문자열 (생략 시 오늘)
 */
export const fetchLiveBoardRooms = async (
  anyday?: string,
): Promise<LiveBoardRoomDto[]> => {
  return await apiClient.get<LiveBoardRoomDto[]>("/api/liveboard/room", {
    ...(anyday ? { anyday } : {}),
  });
};

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
