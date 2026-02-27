import { apiClient } from "../../core/client";
import { ApiResponse } from "../../shared/types/common";
import { User, UserProfileUpdateRequest } from "./types";

/**
 * 사용자 관련 API 함수 모음
 * 사용자 정보 조회, 수정 등 사용자 관리 기능
 */

/**
 * 현재 로그인한 사용자 정보 조회 API
 * JWT 토큰을 기반으로 사용자 정보 반환
 *
 * @returns 현재 사용자 정보
 */
export async function usersGetMeAPI(): Promise<ApiResponse<User>> {
  return apiClient.get("/api/v1/users/me");
}

/**
 * 사용자 프로필 수정 API
 * 닉네임, 프로필 이미지 등 사용자 정보 업데이트
 *
 * @param request - 프로필 수정 요청 데이터
 * @returns 수정된 사용자 정보
 */
export async function usersUpdateProfileAPI(
  request: UserProfileUpdateRequest,
): Promise<ApiResponse<User>> {
  return apiClient.patch("/api/v1/users/profile", request);
}

/**
 * 사용자 탈퇴 API
 * 현재 로그인한 사용자 계정 삭제
 *
 * @returns 탈퇴 처리 결과
 */
export async function usersDeleteAccountAPI(): Promise<ApiResponse<void>> {
  return apiClient.delete("/api/v1/users/account");
}
