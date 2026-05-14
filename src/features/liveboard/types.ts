import { LineupRowDto } from "@/src/shared/types/lineup";
import { 
  SkyStatus, 
  RainType, 
  WeatherApiStatus, 
  NowCastDto, 
  ForeCastDto 
} from "@/src/shared/types/weather";
import { LiveBoardStatus } from "@/src/shared/types/match";

/**
 * Liveboard 도메인 타입 정의
 *
 * Why: 백엔드 LiveBoardRoomResponseDto와 구조를 동기화하여 타입 안정성 확보.
 * 공통 타입은 shared 레이어에서 관리함.
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
 * 라이브보드 메인 목록 조회를 위한 룸 요약 데이터
 */
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

/**
 * 구장 날씨 조회 API 응답 DTO
 */
export interface MatchWeatherDto {
  stadiumName: string | null;
  /** 기상청 API 응답 상태 */
  status: WeatherApiStatus;
  nowCast: NowCastDto | null;
  foreCast: ForeCastDto[];
}
