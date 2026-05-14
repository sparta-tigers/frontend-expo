import { TeamMeta } from "@/src/utils/team";
import { NowCastDto, ForeCastDto } from "./weather";

/**
 * 경기(Match) 도메인 핵심 데이터 타입
 * 
 * Why: Match는 프로젝트의 가장 중요한 엔티티로, 여러 피처에서 참조됨.
 * 피처 간 순환 참조를 방지하기 위해 shared 레이어에서 표준화된 타입을 제공함.
 */

export type LiveBoardStatus = "TODAY" | "UPCOMING" | "PAST";
export type LeagueType = "REGULAR" | "PRESEASON" | "POST_SEASON";

export interface MatchTeamInfo {
  code: string;
  name: string;
  meta: TeamMeta;
}

/**
 * 🏆 RankingUIModel: 순위 목록 UI에 최적화된 모델
 */
export interface RankingUIModel extends RankingRowDto {
  /** 구단 메타데이터 (엠블럼, 컬러 등) */
  meta: TeamMeta;
}

/**
 * 📋 MatchSummary: 목록형 UI(일정 등)에 최적화된 경기 요약 정보
 */
export interface MatchSummary {
  matchId: number;
  day: number;
  startTime: string; // HH:mm
  homeTeam: MatchTeamInfo;
  awayTeam: MatchTeamInfo;
  stadium: string;
  isLive: boolean;
  displayStatus: string;
  displayResult?: string | null;
  location: "H" | "A";
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
  matchId: number;
  day: number;
  opponentCode: string;
  location: "H" | "A";
  timeText: string;
}

export interface RankingRowDto {
  leagueType: LeagueType;
  rank: number;
  teamId: number;
  teamName: string;
  teamCode: string;
  matchCount: number;
  winCount: number;
  loseCount: number;
  drawCount: number;
  winRate: number;
}
