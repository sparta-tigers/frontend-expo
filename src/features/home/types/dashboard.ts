// src/features/home/types/dashboard.ts
import { IconSymbolName } from "@/components/ui/icon-symbol";

export interface LineupRowDto {
  /** 타순 (예: "1", "2") */
  battingOrder: string;
  /** 선수 이름 */
  name: string;
  /** 수비 포지션 (예: "DH", "CF") */
  position: string;
  /** 안타 수 (실시간) */
  hits?: number;
  /** 타점 (실시간) */
  rbis?: number;
}

export interface MiniStatDto {
  key: "visits" | "alarms" | "remainingGames";
  valueText: string;
  label: string;
  /** 표시할 아이콘 이름 — IconSymbolName으로 제한하여 타입 안전성 확보 */
  iconName: IconSymbolName;
  tone: "pink" | "yellow" | "green";
}

export interface HomeDashboardSummaryDto {
  nickname: string;
  enrollmentDays: number;
  remainingMatches: number;
  favoriteTeamCode: string | null;
  /** 오늘의 선발 라인업 (응원 팀 기준) */
  todayLineup: LineupRowDto[];
}
