import { LineupRowDto } from "@/src/features/home/types/dashboard";

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

export type WeatherApiStatus =
  | "SUCCESS"
  | "NO_DATA"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

/**
 * 실시간 초단기 실황 데이터 (NowCast)
 *
 * Why: 경기 시작 전후의 "현재 시점" 날씨 정보를 제공하기 위한 데이터 모델.
 * 기상청 실황(초단기실황) API에 의존하며, 데이터 부재 시 null 허용으로 방어적 렌더링을 강제한다.
 */
export interface NowCastDto {
  referenceTime: string;
  stadium: string;
  temperature: number | null;
  skyStatus: SkyStatus | null;
  rainType: RainType | null;
  rainAmount: number | null;
  /** 강수확률(POP, 0~100). 단기예보 미제공/실패 시 null. */
  rainProbability: number | null;
  windSpeed: number | null;
  windDirection: string | null;
}

/**
 * 시간대별 단기 예보 데이터 (ForeCast)
 *
 * Why: 경기 중/후의 날씨 변화 추이를 테이블 형태로 시각화하기 위한 데이터 모델.
 * 기상청 단기예보 API 결과를 기반으로 하며, 기상청 데이터 특유의 결측치(null) 가능성을
 * 프론트엔드에서 인지하고 방어적으로 처리하도록 유도한다.
 */
export interface ForeCastDto {
  castTime: string;
  stadium: string;
  temperature: number | null;
  skyStatus: SkyStatus | null;
  rainProbability: number | null;
  rainType: RainType | null;
  rainAmount: number | null;
}

/**
 * 라이브보드 메인 목록 조회를 위한 룸 요약 데이터
 *
 * Why: 대시보드 목록에서 각 경기의 현재 상태(LIVE/TODAY 등)와 날씨 요약을 한눈에 보여주기 위한 SSOT.
 * 개별 필드(nowCast, foreCast)를 포함하여 목록과 상세 조회 간의 데이터 모델 일관성을 유지한다.
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

/**
 * 구장 날씨 조회 API 응답 DTO
 *
 * Why: GET /api/liveboard/{matchId}/weather 응답과 1:1 매핑.
 * NowCast + ForeCast를 단일 호출에 받아 칩/탭 전환 시 추가 호출 없이 로컬 상태에서 렌더링.
 * status: 기상청 API 상태 — 점검/장애 시 UI에 원인 메시지를 표시하는 데 사용.
 */
export interface MatchWeatherDto {
  stadiumName: string | null;
  /** 기상청 API 응답 상태 */
  status: WeatherApiStatus;
  nowCast: NowCastDto | null;
  foreCast: ForeCastDto[];
}
