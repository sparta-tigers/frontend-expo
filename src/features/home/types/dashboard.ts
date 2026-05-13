// src/features/home/types/dashboard.ts
import { IconSymbolName } from "@/components/ui/icon-symbol";

/**
 * 라인업 항목 데이터 모델
 *
 * Why: 홈 화면의 라인업 섹션에서 선수 개별 정보(이름, 포지션, 실시간 성적 등)를 표시하기 위함.
 */
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
