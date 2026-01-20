/**
 * JWT 토큰 정보 인터페이스
 * 백엔드 Token 엔티티와 매핑되는 DTO
 */
export interface Token {
  accessToken: string;
  accessTokenIssuedAt: Date;
  accessTokenExpiredAt: Date;
  refreshToken: string;
  refreshTokenIssuedAt: Date;
  refreshTokenExpiredAt: Date;
}

/**
 * 로그인 요청 인터페이스
 * 백엔드 UserLoginRequest와 매핑되는 DTO
 */
export interface AuthSigninRequest {
  email: string;
  password: string;
}

/**
 * 회원가입 요청 인터페이스
 * 백엔드 UserSignupRequest와 매핑되는 DTO
 */
export interface AuthSignupRequest {
  email: string;
  password: string;
  nickname: string;
}
