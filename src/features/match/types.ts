import { TeamMeta } from "@/src/utils/team";
import { LiveBoardStatus, NowCastDto, ForeCastDto } from "@/src/features/liveboard/types";

/**
 * Match 관련 데이터 타입 정의
 * 
 * Why: 백엔드 MatchScheduleResponseDto와 구조를 동기화하여 타입 안정성 확보.
 * 도메인 분리 원칙에 따라 features/match에서 공통 관리함.
 */

/**
 * 🏟️ MatchTeamInfo: UI에서 사용하는 팀 정보 (TeamMeta 포함)
 */
export interface MatchTeamInfo {
  code: string;
  name: string;
  meta: TeamMeta;
}

/**
 * 🏆 RankingUIModel: 순위 목록 UI에 최적화된 모델 (SSOT)
 */
export interface RankingUIModel extends RankingRowDto {
  /** 구단 메타데이터 (엠블럼, 컬러 등) */
  meta: TeamMeta;
}

/**
 * 📋 MatchSummary: 목록형 UI(일정 등)에 최적화된 경기 요약 정보
 * Why: 컴포넌트 내부 로직을 줄이기 위해 가공된 필드(isLive, displayStatus)를 미리 포함함.
 */
export interface MatchSummary {
  matchId: number;
  day: number; // 🚨 추가: 캘린더 렌더링용 일자 (1-31)
  startTime: string; // HH:mm
  homeTeam: MatchTeamInfo;
  awayTeam: MatchTeamInfo;
  stadium: string;
  isLive: boolean;
  displayStatus: string; // "18:30", "경기중", "종료" 등
  displayResult?: string | null; // "승", "무", "패" 등
  location: "H" | "A"; // 내 팀 기준 홈/어웨이
}

export interface PlayerPosition {
  name: string;
  x: number;
  y: number;
}

/**
 * 🔬 MatchDetail: 상세 화면(라이브보드)에 필요한 전체 경기 정보
 */
export interface MatchDetail extends MatchSummary {
  liveBoardStatus: LiveBoardStatus;
  nowCast: NowCastDto | null;
  foreCast: ForeCastDto[] | null;

  // 🚨 실시간 경기 상태 필드 추가 (Zero Magic: 목데이터 대체용)
  inning?: number;
  inningHalf?: "초" | "말";
  homeScore?: number;
  awayScore?: number;
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


export interface MatchScheduleDto {
  matchId: number;       // 경기 고유 ID (🚨 추가)
  day: number;           // 경기 일 (1-31)
  opponentCode: string;  // 상대 팀 코드 (예: "OB", "HT", "LG")
  location: "H" | "A";   // 홈/어웨이 여부
  timeText: string;      // 경기 시작 시간 (HH:mm)
}

export interface MatchScheduleResponse {
  resultType: "SUCCESS" | "ERROR";
  data: MatchScheduleDto[];
  message?: string;
}

export type LeagueType = "REGULAR" | "PRESEASON" | "POST_SEASON";

export interface RankingRowDto {
  leagueType: LeagueType;
  rank: number;
  teamId: number;
  teamName: string;
  teamCode: string; // 백엔드 TeamCode Enum (HT, LG 등)
  matchCount: number;
  winCount: number;
  loseCount: number;
  drawCount: number;
  winRate: number;
}

export interface TeamRankingResponse {
  resultType: "SUCCESS" | "ERROR";
  data: RankingRowDto[];
  message?: string;
}
