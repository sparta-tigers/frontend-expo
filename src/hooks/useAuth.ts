import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { authSigninAPI, authSignoutAPI, authSignupAPI } from "../api/auth";
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
   * AsyncStorage에서 토큰 로드
   * 앱 시작 시 저장된 인증 정보 복원
   */
  const loadToken = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (accessToken && refreshToken) {
        // 실제로는 토큰 유효성 검증 필요
        // 여기서는 단순히 저장된 토큰으로 상태 설정
        setUser({
          accessToken,
          refreshToken,
          accessTokenIssuedAt: new Date(),
          accessTokenExpiredAt: new Date(),
          refreshTokenIssuedAt: new Date(),
          refreshTokenExpiredAt: new Date(),
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

      if (response.resultType === "SUCCESS" && response.data) {
        const tokenData = response.data;

        // AsyncStorage에 토큰 저장
        await AsyncStorage.setItem("accessToken", tokenData.accessToken);
        await AsyncStorage.setItem("refreshToken", tokenData.refreshToken);

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

      if (response.resultType === "SUCCESS" && response.data) {
        const tokenData = response.data;

        // AsyncStorage에 토큰 저장
        await AsyncStorage.setItem("accessToken", tokenData.accessToken);
        await AsyncStorage.setItem("refreshToken", tokenData.refreshToken);

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
      // 로컬 토큰 삭제
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
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
