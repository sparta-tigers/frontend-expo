/**
 * 즐겨찾기 팀 관련 API 클라이언트
 * 백엔드 FavTeamController (/api/users/fav)와 연동
 */

import { apiClient } from "@/src/core/client";
import type { ApiResponse } from "@/src/shared/types/common";
import {
  FavoriteTeam,
  FavoriteTeamRequest,
} from "./favorite-team";

/**
 * 즐겨찾기 팀 추가 API
 * POST /api/users/fav
 */
export async function favoriteTeamAddAPI(
  request: FavoriteTeamRequest,
): Promise<ApiResponse<FavoriteTeam>> {
  return apiClient.post("/api/users/fav", request);
}

/**
 * 내 즐겨찾기 팀 조회 API
 * GET /api/users/fav
 */
export async function favoriteTeamGetAPI(): Promise<ApiResponse<FavoriteTeam>> {
  return apiClient.get("/api/users/fav");
}

/**
 * 즐겨찾기 팀 수정 API
 * PATCH /api/users/fav
 */
export async function favoriteTeamUpdateAPI(
  request: FavoriteTeamRequest,
): Promise<ApiResponse<FavoriteTeam>> {
  return apiClient.patch("/api/users/fav", request);
}

/**
 * 즐겨찾기 팀 삭제 API
 * DELETE /api/users/fav
 */
export async function favoriteTeamDeleteAPI(): Promise<ApiResponse<void>> {
  return apiClient.delete("/api/users/fav");
}
