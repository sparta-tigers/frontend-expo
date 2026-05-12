// src/features/home/types/ranking.ts
import { TeamDto } from "./team";

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
