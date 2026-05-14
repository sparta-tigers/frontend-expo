// src/features/liveboard/types.ts
import { LineupRowDto } from "@/src/shared/types/lineup";
import { 
  SkyStatus, 
  RainType, 
  WeatherApiStatus, 
  NowCastDto, 
  ForeCastDto 
} from "@/src/shared/types/weather";
import { LiveBoardStatus, PlayerPosition, MatchRoomDto } from "@/src/shared/types/match";

/**
 * Liveboard 도메인 타입 정의
 */

export type { 
  LineupRowDto, 
  SkyStatus, 
  RainType, 
  WeatherApiStatus, 
  NowCastDto, 
  ForeCastDto,
  LiveBoardStatus
};

/**
 * 🏟️ LiveBoardRoomDto
 * shared/types/match.ts의 MatchRoomDto를 상속/참조하여 도메인 간 호환성 유지
 */
export type LiveBoardRoomDto = MatchRoomDto;

/**
 * 🛰️ LiveboardData: 실시간 중계 화면에 표시될 동적 데이터 모델
 * Why: MatchDetail(정적)과 분리하여 실시간 데이터만 독립적으로 패칭/갱신하기 위함.
 */
export interface LiveboardData {
  matchId: number;
  liveBoardStatus: LiveBoardStatus;
  nowCast: NowCastDto | null;
  foreCast: ForeCastDto[] | null;
  connectCount: number;
  homeScore?: number;
  awayScore?: number;
  inning?: number;
  inningHalf?: "초" | "말";
  ballCount?: number;
  strikeCount?: number;
  outCount?: number;
  bases?: { first: boolean; second: boolean; third: boolean };
  pitcherName?: string;
  pitchCount?: number;
  lastEvent?: string;
  defenders?: PlayerPosition[];
  batter?: PlayerPosition;
  runner?: PlayerPosition;
}

export interface MatchLineupDto {
  matchId: number;
  homeTeamName: string | null;
  homeTeamCode: string | null;
  awayTeamName: string | null;
  awayTeamCode: string | null;
  homeBatters: LineupRowDto[];
  awayBatters: LineupRowDto[];
}

export interface MatchWeatherDto {
  stadiumName: string | null;
  status: WeatherApiStatus;
  nowCast: NowCastDto | null;
  foreCast: ForeCastDto[];
}
