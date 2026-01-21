import { apiClient, ApiResponse } from "./index";
import { AuthSigninRequest, AuthSignupRequest, Token } from "./types/auth";

/**
 * 인증 관련 API 함수 모음
 * 로그인, 회원가입 등 사용자 인증 처리
 */

/**
 * 사용자 로그인 API
 * 이메일과 비밀번호로 JWT 토큰 발급
 *
 * @param request - 로그인 요청 데이터 (이메일, 비밀번호)
 * @returns JWT 토큰 정보 (액세스 토큰, 리프레시 토큰)
 */
export async function authSigninAPI(
  request: AuthSigninRequest,
): Promise<ApiResponse<Token>> {
  return apiClient.post("/api/v1/auth/login", request);
}

/**
 * 사용자 회원가입 API
 * 신규 사용자 생성 및 자동 로그인
 *
 * @param request - 회원가입 요청 데이터 (이메일, 닉네임, 비밀번호)
 * @returns JWT 토큰 정보 (회원가입 후 자동 로그인)
 */
export async function authSignupAPI(
  request: AuthSignupRequest,
): Promise<ApiResponse<Token>> {
  return apiClient.post("/api/v1/auth/signup", request);
}

/**
 * 토큰 리프레시 API
 * 만료된 액세스 토큰을 리프레시 토큰으로 갱신
 *
 * @param refreshToken - 리프레시 토큰
 * @returns 새로운 JWT 토큰 정보
 console.log("🚀 ~ 정보:", 정보)
 */
export async function authRefreshTokenAPI(
  refreshToken: string,
): Promise<ApiResponse<Token>> {
  return apiClient.post("/api/v1/auth/refresh", { refreshToken });
}

/**
 * 로그아웃 API
 * 서버에 토큰 무효화 요청
 *
 * @returns 로그아웃 처리 결과
 */
export async function authSignoutAPI(): Promise<ApiResponse<void>> {
  return apiClient.post("/api/v1/auth/logout");
}
