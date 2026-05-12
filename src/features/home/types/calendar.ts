// src/features/home/types/calendar.ts
export interface CalendarGameDto {
  day: number;
  location?: "H" | "A" | undefined;
  opponentCode?: string | undefined;
  opponentShort: string;
  timeText?: string | undefined;
  isSelected?: boolean | undefined;
  opponentColor?: string | undefined;
}

export type CalendarCellModel = {
  day: number;
  matchId?: number | undefined;
  hasGame: boolean;
  hasAttendance?: boolean | undefined;
  location?: "H" | "A" | undefined;
  opponentCode?: string | undefined;
  opponentShort: string;
  timeText?: string | undefined;
  isSelected: boolean;
  opponentColor?: string | undefined;
};
