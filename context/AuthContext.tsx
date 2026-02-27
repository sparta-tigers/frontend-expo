import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { authSigninAPI, authSignoutAPI, authSignupAPI } from "../src/api/auth";
import { ResultType } from "../src/api/index";
import { AuthSigninRequest, AuthSignupRequest } from "../src/api/types/auth";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../src/utils/tokenStore";

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
 * AuthContext 타입 정의
 * 인증 상태와 관련 함수들을 포함
 */
interface AuthContextType {
  user: SimpleToken | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signin: (credentials: AuthSigninRequest) => Promise<boolean>;
  signup: (userData: AuthSignupRequest) => Promise<boolean>;
  signout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

/**
 * AuthContext 생성
 * 초기값은 undefined로 설정하여 Provider 외부에서 사용 시 에러 발생
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * useAuth 훅
 * AuthContext에 접근하기 위한 커스텀 훅
 *
 * @returns AuthContextType - 인증 상태와 관련 함수들
 * @throws Error - Provider 외부에서 사용 시 에러 발생
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

/**
 * AuthProvider 컴포넌트
 * 앱 전체에 인증 상태를 제공하는 Provider
 *
 * @param children - 자식 컴포넌트들
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
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

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isLoggedIn,
    signin,
    signup,
    signout,
    loadToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
