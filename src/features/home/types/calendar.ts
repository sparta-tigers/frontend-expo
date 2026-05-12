export interface CalendarGameDto {
  day: number;
  location?: "H" | "A" | undefined;
  opponentCode?: string | undefined; // 🚨 팀 식별을 위한 코드 추가
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
  matchId?: number | undefined; // 🚨 수정
  hasGame: boolean;
  hasAttendance?: boolean | undefined; // 🚨 수정: 직관 기록 여부
  location?: "H" | "A" | undefined;
  opponentCode?: string | undefined; // 🚨 팀 식별을 위한 코드 추가
  opponentShort: string;
  timeText?: string | undefined;
  isSelected: boolean;
  opponentColor?: string | undefined;
};
