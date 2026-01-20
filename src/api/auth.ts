import { apiClient, ApiResponse } from "@/api/index";
import { AuthSigninRequest, Token } from "@/api/types/auth";

/**
 * 사용자 로그인 API
 * @param request - 로그인 요청 정보 (이메일, 비밀번호)
 * @returns Promise<ApiResponse<Token>> - JWT 토큰 정보
 */
export async function authSigninAPI(
  request: AuthSigninRequest,
): Promise<ApiResponse<Token>> {
  return apiClient.post<Token>("/api/v1/auth/login", request);
}
