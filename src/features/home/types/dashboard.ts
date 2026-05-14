// src/features/home/types/dashboard.ts
import { IconSymbolName } from "@/components/ui/icon-symbol";
import { LineupRowDto } from "@/src/shared/types/lineup";

/**
 * 미니 통계(카드) 데이터 모델
 *
 * Why: 홈 화면 상단의 핵심 요약 정보(직관 횟수, 알람 등)를 카드 형태로 렌더링하기 위함.
 */
export interface MiniStatDto {
  key: "visits" | "alarms" | "remainingGames";
  valueText: string;
  label: string;
  /** 표시할 아이콘 이름 — IconSymbolName으로 제한하여 타입 안전성 확보 */
  iconName: IconSymbolName;
  tone: "pink" | "yellow" | "green";
}

/**
 * 홈 대시보드 요약 정보 데이터 모델
 *
 * Why: 홈 화면의 마이팀 정보와 오늘자 라인업 등 개인화된 정보를 통합하여 제공하기 위함.
 */
export interface HomeDashboardSummaryDto {
  nickname: string;
  enrollmentDays: number;
  remainingMatches: number;
  favoriteTeamCode: string | null;
  /** 오늘의 선발 라인업 (응원 팀 기준) */
  todayLineup: LineupRowDto[];
}
