// src/features/liveboard/types.ts
import { LineupRowDto } from "@/src/shared/types/lineup";
import {
  InningTextsDto,
  LiveBoardDataDto,
  LiveBoardStatus,
  MatchScoreDto,
  PlayerDto,
  PlayerPosition,
} from "@/src/shared/types/match";
import {
  ForeCastDto,
  NowCastDto,
  RainType,
  SkyStatus,
  WeatherApiStatus,
} from "@/src/shared/types/weather";

/**
 * Liveboard 도메인 타입 정의
 */

export type {
  ForeCastDto,
  InningTextsDto,
  LineupRowDto,
  LiveBoardDataDto,
  LiveBoardStatus,
  MatchScoreDto,
  NowCastDto,
  PlayerDto,
  RainType,
  SkyStatus,
  WeatherApiStatus,
};

/**
 * 🛰️ BroadcastItem: 구조화된 개별 중계 아이템
 * Why: 매퍼 계층에서 문자열을 파싱하여 UI가 조건 없이 렌더링할 수 있게 함.
 */
export type BroadcastType =
  | "BATTER_INFO"
  | "PITCH_LOG"
  | "PLAY_RESULT"
  | "INNING_INFO";

export interface BroadcastItem {
  id: string; // {inning}-{index}
  type: BroadcastType;
  text: string;
}

/**
 * 🛰️ LiveboardData: 실시간 중계 화면에 표시될 동적 데이터 모델
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
  inningHalf?: "초" | "말" | undefined;
  ballCount?: number;
  strikeCount?: number;
  outCount?: number;
  bases?: { first: boolean; second: boolean; third: boolean };
  pitcherName?: string;
  pitchCount?: number;
  lastEvent?: string | null;
  defenders?: PlayerPosition[];
  batter?: PlayerPosition | null;
  runner1?: PlayerPosition | null;
  runner2?: PlayerPosition | null;
  runner3?: PlayerPosition | null;
  inningTexts?: { [inning: number]: BroadcastItem[] } | undefined;
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
