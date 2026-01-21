import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { authSigninAPI, authSignoutAPI, authSignupAPI } from "../api/auth";
import { ResultType } from "../api/index";
import { AuthSigninRequest, AuthSignupRequest, Token } from "../api/types/auth";

/**
 * 인증 상태 관리 훅
 * 로그인, 회원가입, 토큰 관리 등 인증 관련 상태와 기능 제공
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
  const [user, setUser] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * 로그인 여부 확인
   * 토큰 존재 여부로 판단
   */
  const isLoggedIn = !!user;

  /**
   * SecureStore에서 토큰 로드
   * 앱 시작 시 저장된 인증 정보 복원
   */
  const loadToken = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const accessToken = await SecureStore.getItemAsync("accessToken");
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (accessToken && refreshToken) {
        // 토큰 만료 시간 정보 저장 (실제 만료 시간 유지)
        const issuedAt = await SecureStore.getItemAsync("accessTokenIssuedAt");
        const expiredAt = await SecureStore.getItemAsync(
          "accessTokenExpiredAt",
        );
        const refreshIssuedAt = await SecureStore.getItemAsync(
          "refreshTokenIssuedAt",
        );
        const refreshExpiredAt = await SecureStore.getItemAsync(
          "refreshTokenExpiredAt",
        );

        setUser({
          accessToken,
          refreshToken,
          accessTokenIssuedAt: issuedAt ? new Date(issuedAt) : new Date(),
          accessTokenExpiredAt: expiredAt ? new Date(expiredAt) : new Date(),
          refreshTokenIssuedAt: refreshIssuedAt
            ? new Date(refreshIssuedAt)
            : new Date(),
          refreshTokenExpiredAt: refreshExpiredAt
            ? new Date(refreshExpiredAt)
            : new Date(),
        });
      }
    } catch (error) {
      console.error("토큰 로드 실패:", error);
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

        // SecureStore에 토큰 및 만료 시간 저장
        await SecureStore.setItemAsync("accessToken", tokenData.accessToken);
        await SecureStore.setItemAsync("refreshToken", tokenData.refreshToken);
        await SecureStore.setItemAsync(
          "accessTokenIssuedAt",
          tokenData.accessTokenIssuedAt.toISOString(),
        );
        await SecureStore.setItemAsync(
          "accessTokenExpiredAt",
          tokenData.accessTokenExpiredAt.toISOString(),
        );
        await SecureStore.setItemAsync(
          "refreshTokenIssuedAt",
          tokenData.refreshTokenIssuedAt.toISOString(),
        );
        await SecureStore.setItemAsync(
          "refreshTokenExpiredAt",
          tokenData.refreshTokenExpiredAt.toISOString(),
        );

        // 상태 업데이트
        setUser(tokenData);
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
        const tokenData = response.data;

        // SecureStore에 토큰 및 만료 시간 저장
        await SecureStore.setItemAsync("accessToken", tokenData.accessToken);
        await SecureStore.setItemAsync("refreshToken", tokenData.refreshToken);
        await SecureStore.setItemAsync(
          "accessTokenIssuedAt",
          tokenData.accessTokenIssuedAt.toISOString(),
        );
        await SecureStore.setItemAsync(
          "accessTokenExpiredAt",
          tokenData.accessTokenExpiredAt.toISOString(),
        );
        await SecureStore.setItemAsync(
          "refreshTokenIssuedAt",
          tokenData.refreshTokenIssuedAt.toISOString(),
        );
        await SecureStore.setItemAsync(
          "refreshTokenExpiredAt",
          tokenData.refreshTokenExpiredAt.toISOString(),
        );

        // 상태 업데이트
        setUser(tokenData);
        return true;
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
      // 로컬 토큰 및 만료 시간 삭제
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await SecureStore.deleteItemAsync("accessTokenIssuedAt");
      await SecureStore.deleteItemAsync("accessTokenExpiredAt");
      await SecureStore.deleteItemAsync("refreshTokenIssuedAt");
      await SecureStore.deleteItemAsync("refreshTokenExpiredAt");
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
