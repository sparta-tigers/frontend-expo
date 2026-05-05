export interface TeamDto {
  name: string;
  shortName: string;
}

export interface MiniStatDto {
  key: "visits" | "alarms" | "remainingGames";
  valueText: string;
  label: string;
  iconName: "chart.bar.fill" | "clock.fill" | "star.fill" | string;
  tone: "pink" | "yellow" | "green";
}

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

export interface LineupRowDto {
  order: number;
  name: string;
  position: string;
}

export interface CalendarGameDto {
  day: number;
  location?: "H" | "A";
  opponentShort: string;
  timeText?: string;
  isSelected?: boolean;
}

export type CalendarCellModel = {
  day: number;
  hasGame: boolean;
  location?: "H" | "A";
  opponentShort: string;
  timeText?: string;
  isSelected: boolean;
};
