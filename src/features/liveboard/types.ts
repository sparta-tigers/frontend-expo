// src/features/liveboard/types.ts
import { LineupRowDto } from "@/src/shared/types/lineup";
import { 
  SkyStatus, 
  RainType, 
  WeatherApiStatus, 
  NowCastDto, 
  ForeCastDto 
} from "@/src/shared/types/weather";
import { LiveBoardStatus, PlayerPosition } from "@/src/shared/types/match";

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
 * 🛰️ BroadcastItem: 구조화된 개별 중계 아이템
 * Why: 매퍼 계층에서 문자열을 파싱하여 UI가 조건 없이 렌더링할 수 있게 함.
 */
export type BroadcastType = "BATTER_INFO" | "PITCH_LOG" | "PLAY_RESULT" | "INNING_INFO";

export interface BroadcastItem {
  id: string; // {inning}-{index}
  type: BroadcastType;
  text: string;
}

/**
 * 🛰️ InningTexts: 이닝별 문자중계 원본 데이터 (백엔드 대응)
 */
export interface InningTextsDto {
  inningOneTexts?: string[];
  inningTwoTexts?: string[];
  inningThreeTexts?: string[];
  inningFourTexts?: string[];
  inningFiveTexts?: string[];
  inningSixTexts?: string[];
  inningSevenTexts?: string[];
  inningEightTexts?: string[];
  inningNineTexts?: string[];
  inningExtraTexts?: string[];
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
  inningHalf?: "초" | "말";
  ballCount?: number;
  strikeCount?: number;
  outCount?: number;
  bases?: { first: boolean; second: boolean; third: boolean };
  pitcherName?: string;
  pitchCount?: number;
  lastEvent?: string;
  defenders?: PlayerPosition[];
  batter?: PlayerPosition | null;
  runner?: PlayerPosition | null;
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

/**
 * 🛰️ LiveBoardDataDto: 백엔드 실시간 데이터 DTO
 */
export interface PlayerDto {
  role: string;
  name: string;
}

export interface MatchScoreDto {
  strike: number;
  ball: number;
  out: number;
  homeScore: string;
  awayScore: string;
  pitcherCount: string;
}

export interface LiveBoardDataDto {
  matchId: number;
  players: PlayerDto[];
  matchScore: MatchScoreDto;
  inningTexts: InningTextsDto;
  currentInning: string;
}
