// src/features/home/types/ranking.ts
import { TeamDto } from "./team";

/**
 * 순위표 항목 데이터 모델
 *
 * Why: 홈 화면 및 순위표 섹션에서 개별 구단의 현재 순위, 경기 수, 승무패, 승률 등의 통계를 표시하기 위함.
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
