import { RequireAtLeastOne } from "@/src/shared/types/common";

/**
 * 즐겨찾기 팀 관련 타입 정의
 * 백엔드 FavTeamResponseDto, FavTeamRequestDto와 연동
 */

/**
 * 즐겨찾기 팀 정보 인터페이스 (FavTeamResponseDto)
 */
export interface FavoriteTeam {
  id: number;
  teamId: number;
  teamName: string;
  teamCode: string;
  userId: number;
}

/**
 * 즐겨찾기 팀 요청 인터페이스 (FavTeamRequestDto)
 */
export interface FavoriteTeamRequestBase {
  teamId?: number;
  teamCode?: string;
}

export type FavoriteTeamRequest = RequireAtLeastOne<FavoriteTeamRequestBase, "teamId" | "teamCode">;
