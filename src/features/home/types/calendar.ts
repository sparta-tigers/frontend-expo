/**
 * 캘린더 경기 정보 데이터 모델
 *
 * Why: 캘린더 화면에서 특정 날짜의 경기 정보(상대 팀, 장소, 시간 등)를 표시하기 위해 사용됩니다.
 */
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
  opponentColorToken?: string | undefined; // 🚨 추가: 테마 토큰 기반 컬러링용
};
