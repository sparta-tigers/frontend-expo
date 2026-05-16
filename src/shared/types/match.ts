// src/shared/types/match.ts

import { TeamMeta } from "@/src/utils/team";
import { NowCastDto, ForeCastDto } from "@/src/shared/types/weather";

export type MatchStatus = "READY" | "ONGOING" | "FINISHED" | "CANCELLED" | "POSTPONED";
export type LiveBoardStatus = "UPCOMING" | "TODAY" | "PAST";
export type LeagueType = "REGULAR" | "PRESEASON" | "POST_SEASON" | "DREAM" | "NANUM";
export type TeamLocation = "H" | "A";

export interface MatchTeamInfo {
  code: string;
  name: string;
  meta: TeamMeta;
}

/**
 * 🔬 MatchSummary: 목록이나 요약 UI에 필요한 핵심 경기 정보
 */
export interface MatchSummary {
  matchId: number;
  day: number;
  startTime: string;
  homeTeam: MatchTeamInfo;
  awayTeam: MatchTeamInfo;
  stadium: string;
  isLive: boolean;
  displayStatus: string;
  displayResult?: string | null;
  location: TeamLocation;
}

/**
 * 🔬 MatchDetail: 경기 상세 정보 (Liveboard 제외)
 * Why: 중계 데이터는 독립적인 훅에서 관리하므로, 여기서는 경기 자체의 메타데이터만 유지함.
 */
export interface MatchDetail extends MatchSummary {
  liveBoardStatus: LiveBoardStatus;
  // Liveboard 전용 필드(nowCast, inning 등)는 여기서 제거됨.
}

export interface MatchScheduleDto {
  matchId: number;
  day: number;
  opponentCode: string;
  location: TeamLocation;
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

export interface RankingUIModel extends RankingRowDto {
  meta: TeamMeta;
}

export interface PlayerPosition {
  name: string;
  role: string;
  x: number;
  y: number;
}

/**
 * 🏟️ MatchRoomDto (구 LiveBoardRoomDto)
 * 
 * Why: 경기 상세 정보 조회를 위한 DTO. 
 * Match 도메인과 Liveboard 도메인이 공동으로 참조하는 핵심 정보이므로 shared 레이어에 위치함.
 */
export interface MatchRoomDto {
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
  inningTexts: import("@/src/features/liveboard/types").InningTextsDto | null;
}
