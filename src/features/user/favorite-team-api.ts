/**
 * 즐겨찾기 팀 관련 API 클라이언트
 * 백엔드 FavoriteTeam 컨트롤러와 연동
 */

import { apiClient } from "@/src/core/client";
import type { ApiResponse } from "@/src/shared/types/common";
import {
  FavoriteTeam,
  AddFavoriteTeamRequest,
  UpdateFavoriteTeamRequest,
} from "./favorite-team";

/**
 * 즐겨찾기 팀 추가 API
 * POST /api/v1/favorite-teams
 *
 * @param request - 즐겨찾기 팀 추가 요청 데이터
 * @returns 추가된 즐겨찾기 팀 정보
 */
export async function favoriteTeamAddAPI(
  request: AddFavoriteTeamRequest,
): Promise<ApiResponse<FavoriteTeam>> {
  return apiClient.post("/api/v1/favorite-teams", request);
}

/**
 * 내 즐겨찾기 팀 목록 조회 API
 * GET /api/v1/favorite-teams
 *
 * @returns 내 즐겨찾기 팀 목록
 */
export async function favoriteTeamGetListAPI(): Promise<
  ApiResponse<FavoriteTeam[]>
> {
  return apiClient.get("/api/v1/favorite-teams");
}

/**
 * 즐겨찾기 팀 수정 API
 * PATCH /api/v1/favorite-teams/{teamId}
 *
 * @param teamId - 즐겨찾기 팀 고유 ID
 * @param request - 즐겨찾기 팀 수정 요청 데이터
 * @returns 수정된 즐겨찾기 팀 정보
 */
export async function favoriteTeamUpdateAPI(
  teamId: number,
  request: UpdateFavoriteTeamRequest,
): Promise<ApiResponse<FavoriteTeam>> {
  return apiClient.patch(`/api/v1/favorite-teams/${teamId}`, request);
}

/**
 * 즐겨찾기 팀 삭제 API
 * DELETE /api/v1/favorite-teams/{teamId}
 *
 * @param teamId - 즐겨찾기 팀 고유 ID
 * @returns 삭제 처리 결과
 */
export async function favoriteTeamDeleteAPI(
  teamId: number,
): Promise<ApiResponse<void>> {
  return apiClient.delete(`/api/v1/favorite-teams/${teamId}`);
}
