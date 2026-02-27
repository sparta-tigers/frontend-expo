export interface Token {
  accessToken: string;
  accessTokenIssuedAt: Date;
  accessTokenExpiredAt: Date;
  refreshToken: string;
  refreshTokenIssuedAt: Date;
  refreshTokenExpiredAt: Date;
}

export interface AuthSigninRequest {
  email: string;
  password: string;
}

export interface AuthSigninResponse {
  user: {
    id: number;
    email: string;
    nickname: string;
  };
  token: Token;
}

export interface AuthSignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthSignupResponse {
  user: {
    id: number;
    email: string;
    nickname: string;
  };
  token: Token;
}

export interface User {
  id: number;
  email: string;
  nickname: string;
}

export interface UserProfileUpdateRequest {
  nickname: string;
}
