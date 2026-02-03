import { useEffect, useState } from "react";
import { authSigninAPI, authSignoutAPI, authSignupAPI } from "../api/auth";
import { ResultType } from "../api/index";
import { AuthSigninRequest, AuthSignupRequest } from "../api/types/auth";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../utils/tokenStore";

/**
 * 단순화된 토큰 타입
 * TokenStore는 문자열만 저장하므로 만료시간은 현재 시점 기준으로 설정
 */
interface SimpleToken {
  accessToken: string;
  refreshToken: string;
  accessTokenIssuedAt: Date;
  accessTokenExpiredAt: Date;
  refreshTokenIssuedAt: Date;
  refreshTokenExpiredAt: Date;
}

/**
 * 인증 상태 관리 훅
 * TokenStore를 통한 중앙 토큰 관리
 *
 * @returns {
 *   user: 현재 로그인된 사용자 토큰 정보
 *   isLoading: 로딩 상태
 *   isLoggedIn: 로그인 여부
 *   signin: 로그인 함수
 *   signup: 회원가입 함수
 *   signout: 로그아웃 함수
 *   loadToken: 저장된 토큰 로드 함수
 * }
 */
export function useAuth() {
  const [user, setUser] = useState<SimpleToken | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * 로그인 여부 확인
   * 토큰 존재 여부로 판단
   */
  const isLoggedIn = !!user;

  /**
   * TokenStore에서 토큰 로드
   * 앱 시작 시 저장된 인증 정보 복원
   */
  const loadToken = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const accessToken = await getAccessToken();

      if (accessToken) {
        // TokenStore에는 refreshToken도 있어야 함
        const refreshToken = await getRefreshToken();

        if (refreshToken) {
          // 현재 시점 기준으로 만료시간 설정 (1시간 후, 30일 후)
          const now = new Date();
          const accessTokenExpiry = new Date(now.getTime() + 60 * 60 * 1000); // 1시간
          const refreshTokenExpiry = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000,
          ); // 30일

          setUser({
            accessToken,
            refreshToken,
            accessTokenIssuedAt: now,
            accessTokenExpiredAt: accessTokenExpiry,
            refreshTokenIssuedAt: now,
            refreshTokenExpiredAt: refreshTokenExpiry,
          });
        }
      }
    } catch (error) {
      console.error("토큰 로드 실패:", error);
      // 에러 발생 시에도 로딩 상태 종료
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그인 함수
   * 이메일, 비밀번호로 인증 후 토큰 저장
   *
   * @param credentials - 로그인 정보 (이메일, 비밀번호)
   * @returns 로그인 성공 여부
   */
  const signin = async (credentials: AuthSigninRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authSigninAPI(credentials);

      if (response.resultType === ResultType.SUCCESS && response.data) {
        const tokenData = response.data;

        // TokenStore에 토큰 저장
        const success = await setTokens(
          tokenData.accessToken,
          tokenData.refreshToken,
        );
        if (!success) {
          console.error("토큰 저장 실패");
          return false;
        }

        // 상태 업데이트
        setUser({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          accessTokenIssuedAt: tokenData.accessTokenIssuedAt,
          accessTokenExpiredAt: tokenData.accessTokenExpiredAt,
          refreshTokenIssuedAt: tokenData.refreshTokenIssuedAt,
          refreshTokenExpiredAt: tokenData.refreshTokenExpiredAt,
        });

        return true;
      } else {
        console.error("로그인 실패:", response.error?.message);
        return false;
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 회원가입 함수
   * 신규 사용자 생성 후 자동 로그인
   *
   * @param userData - 회원가입 정보 (이메일, 닉네임, 비밀번호)
   * @returns 회원가입 성공 여부
   */
  const signup = async (userData: AuthSignupRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authSignupAPI(userData);

      if (response.resultType === ResultType.SUCCESS && response.data) {
        // 회원가입 성공 후 자동 로그인
        const loginSuccess = await signin({
          email: userData.email,
          password: userData.password,
        });

        if (loginSuccess) {
          return true;
        } else {
          console.error("회원가입 후 자동 로그인 실패");
          return false;
        }
      } else {
        console.error("회원가입 실패:", response.error?.message);
        return false;
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그아웃 함수
   * 서버에 로그아웃 통보 후 로컬 토큰 삭제
   */
  const signout = async (): Promise<void> => {
    try {
      // 서버에 로그아웃 통보 (실패하더라도 로컬 정리는 진행)
      await authSignoutAPI();
    } catch (error) {
      console.error("서버 로그아웃 통보 실패:", error);
    } finally {
      // TokenStore에서 토큰 삭제
      await clearTokens();

      // 상태 초기화
      setUser(null);
    }
  };

  // 컴포넌트 마운트 시 토큰 로드
  useEffect(() => {
    loadToken();
  }, []);

  return {
    user,
    isLoading,
    isLoggedIn,
    signin,
    signup,
    signout,
    loadToken,
  };
}
