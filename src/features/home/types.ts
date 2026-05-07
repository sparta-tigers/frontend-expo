import { IconSymbolName } from "@/components/ui/icon-symbol";

/**
 * 팀 정보 데이터 객체
 *
 * Why: 팀명과 약칭(두 글자)을 관리하여 UI의 배지나 텍스트 영역에서 공통으로 사용하기 위함.
 */
export interface TeamDto {
  /** 팀 전체 명칭 (예: "KIA 타이거즈") */
  name: string;
  /** 팀 약칭 (예: "KIA") */
  shortName: string;
  /** 팀 서브 명칭 (예: "타이거즈") */
  subName: string;
  /** 팀 마스코트 이모지 (예: "🐯") */
  mascotEmoji: string;
  /** 팀 고유 컬러 (Hex) */
  color: string;
}


/**
 * 마이팀 미니 통계 데이터 객체
 *
 * Why: 홈 화면 상단에서 '직관 횟수', '티켓 알림' 등 사용자의 주요 수치를 카드 형태로 요약해서 보여주기 위함.
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
 * 리그 순위 행 데이터 객체
 *
 * Why: 순위표 요약 섹션에서 각 팀의 순위, 승무패 기록 및 내 응원팀 여부를 표시하기 위함.
 */
export interface RankingRowDto {
  rank: number;
  team: TeamDto;
  games: number;
  win: number;
  lose: number;
  draw: number;
  winRate: number;
  isMyTeam?: boolean;
}

/**
 * 라인업 선수 정보 데이터 객체
 *
 * Why: 라인업 목록에서 선수의 타순, 이름, 포지션을 구조화하여 렌더링하기 위함.
 */
export interface LineupRowDto {
  order: number;
  name: string;
  position: string;
}

/**
 * 캘린더 경기 정보 데이터 객체 (API 응답 기반)
 *
 * Why: 월간 일정 섹션에서 특정 날짜의 경기 장소(홈/어웨이), 상대팀, 시간 정보를 관리하기 위함.
 */
export interface CalendarGameDto {
  day: number;
  location?: "H" | "A" | undefined;
  opponentShort: string;
  timeText?: string | undefined;
  isSelected?: boolean | undefined;
  opponentColor?: string | undefined;
}

/**
 * 캘린더 셀 렌더링 모델
 *
 * Why: 캘린더의 그리드를 그릴 때 각 칸(Cell)이 가져야 할 상태(경기 여부, 선택 여부 등)를 정의하기 위함.
 */
export type CalendarCellModel = {
  day: number;
  hasGame: boolean;
  location?: "H" | "A" | undefined;
  opponentShort: string;
  timeText?: string | undefined;
  isSelected: boolean;
  opponentColor?: string | undefined;
};
