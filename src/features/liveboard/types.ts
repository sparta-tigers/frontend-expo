import { LineupRowDto } from "@/src/features/home/types";

/**
 * Liveboard 도메인 타입 정의
 *
 * Why: 백엔드 LiveBoardRoomResponseDto와 구조를 동기화하여 타입 안정성 확보.
 */

export type { LineupRowDto };

export type LiveBoardStatus = "TODAY" | "UPCOMING" | "PAST";

export type SkyStatus = "SUNNY" | "CLOUDY_PARTLY" | "CLOUDY";

export type RainType =
  | "NONE"
  | "RAIN"
  | "RAIN_SNOW"
  | "SNOW"
  | "RAINDROP"
  | "RAINDROP_SNOW_FLYING"
  | "SNOW_FLYING";

export interface NowCastDto {
  referenceTime: string;
  stadium: string;
  temperature: number | null;
  skyStatus: SkyStatus | null;
  rainType: RainType | null;
  rainAmount: number | null;
  windSpeed: number | null;
  windDirection: string | null;
}

export interface ForeCastDto {
  castTime: string;
  stadium: string;
  temperature: number | null;
  skyStatus: SkyStatus | null;
  rainProbability: number | null;
  rainType: RainType | null;
  rainAmount: number | null;
}

export interface LiveBoardRoomDto {
  roomId: string | null;
  matchId: number;
  title: string;
  matchTime: string; // ISO 8601
  liveBoardStatus: LiveBoardStatus;
  awayTeamName: string;
  awayTeamCode: string;
  homeTeamName: string;
  homeTeamCode: string;
  matchResult: string | null;
  stadium: string | null;
  connectCount: number;
  nowCast: NowCastDto | null;
  foreCast: ForeCastDto[] | null;
}

/**
 * 라인업 조회 API 응답 DTO
 *
 * Why: GET /api/liveboard/{matchId}/lineup 응답과 1:1 매핑.
 * 홈/어웨이 양 팀 라인업을 한 번에 수신하여 칩 전환 시 추가 호출 없이 로컬 상태에서 교체.
 */
export interface MatchLineupDto {
  matchId: number;
  homeTeamName: string | null;
  homeTeamCode: string | null;
  awayTeamName: string | null;
  awayTeamCode: string | null;
  homeBatters: LineupRowDto[];
  awayBatters: LineupRowDto[];
}
