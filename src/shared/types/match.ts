// src/shared/types/match.ts

import { TeamMeta } from "@/src/utils/team";

export type MatchStatus = "READY" | "ONGOING" | "FINISHED" | "CANCELLED" | "POSTPONED";
export type LiveBoardStatus = "PRE" | "TODAY" | "PAST";
export type LeagueType = "DREAM" | "NANUM";
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
  liveBoardStatus: "PRE" | "TODAY" | "PAST";
  stadium: string;
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
  x: number;
  y: number;
}
