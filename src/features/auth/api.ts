import { apiClient } from "@/src/core/client";
import { ApiResponse } from "@/src/shared/types/common";
import {
  AuthSigninRequest,
  AuthSigninResponse,
  AuthSignupRequest,
  AuthSignupResponse,
  User,
  UserProfileUpdateRequest,
} from "./types";

/**
 * 인증 관련 API 함수 모음
 * 로그인, 회원가입, 로그아웃 등 인증 기능
 */

/**
 * 로그인 API
 * 이메일과 비밀번호로 JWT 토큰 발급
 *
 * @param request - 로그인 요청 데이터
 * @returns JWT 토큰과 사용자 정보
 */
export async function authSigninAPI(
  request: AuthSigninRequest,
): Promise<ApiResponse<AuthSigninResponse>> {
  return apiClient.post("/api/v1/auth/login", request);
}

/**
 * 회원가입 API
 * 신규 사용자 생성 및 JWT 토큰 발급
 *
 * @param request - 회원가입 요청 데이터
 * @returns JWT 토큰과 생성된 사용자 정보
 */
export async function authSignupAPI(
  request: AuthSignupRequest,
): Promise<ApiResponse<AuthSignupResponse>> {
  return apiClient.post("/api/v1/users", request);
}

/**
 * 로그아웃 API
 * 현재 사용자 세션 종료
 *
 * @returns 로그아웃 성공 응답
 */
export async function authSignoutAPI(): Promise<ApiResponse<null>> {
  return apiClient.post("/api/v1/auth/logout");
}

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
