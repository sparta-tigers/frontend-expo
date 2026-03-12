import {
  authSigninAPI,
  authSignoutAPI,
  authSignupAPI,
} from "@/src/features/auth/api";
import {
  AuthSigninRequest,
  AuthSignupRequest,
} from "@/src/features/auth/types";
import { Logger, maskSensitive } from "@/src/utils/logger";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/src/utils/tokenStore";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * 단순화된 토큰 타입
 * TokenStore는 문자열만 저장하므로 만료시간은 현재 시점 기준으로 설정
 */
interface SimpleToken {
  accessToken: string;
  refreshToken: string;
  email?: string; // 이메일 정보 (선택적)
  userId?: number; // 사용자 ID (선택적)
  nickname?: string; // 사용자 닉네임 (선택적)
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
};

const getTokenClaimFromAccessToken = (
  accessToken: string,
): Pick<SimpleToken, "userId" | "email" | "nickname"> => {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return {};

  const userIdRaw = payload.userId;
  const userId =
    typeof userIdRaw === "number"
      ? userIdRaw
      : typeof userIdRaw === "string"
        ? Number(userIdRaw)
        : undefined;

  const email = typeof payload.email === "string" ? payload.email : undefined;
  const nickname =
    typeof payload.nickname === "string" ? payload.nickname : undefined;

  const result: Pick<SimpleToken, "userId" | "email" | "nickname"> = {};
  if (typeof userId === "number" && Number.isFinite(userId)) {
    result.userId = userId;
  }
  if (typeof email === "string") {
    result.email = email;
  }
  if (typeof nickname === "string") {
    result.nickname = nickname;
  }
  return result;
};

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

      if (__DEV__) {
        Logger.debug("[AuthContext] 토큰 로드 시도");
        Logger.debug("- Access Token 존재 여부:", !!accessToken);
        Logger.debug("- Access Token:", maskSensitive(accessToken));
      }

      if (accessToken) {
        const refreshToken = await getRefreshToken();

        if (__DEV__) {
          Logger.debug("- Refresh Token 존재 여부:", !!refreshToken);
          Logger.debug("- Refresh Token:", maskSensitive(refreshToken));
        }

        if (refreshToken) {
          // 토큰 저장
          await setTokens(accessToken, refreshToken);

          // 사용자 상태 설정
          const claim = getTokenClaimFromAccessToken(accessToken);
          const tokenPayload: SimpleToken = {
            accessToken,
            refreshToken,
            ...claim,
          };

          setUser(tokenPayload);

          if (__DEV__) {
            Logger.debug(
              "✅ [AuthContext] 토큰 로드 성공 - 사용자 상태 설정 완료",
              maskSensitive(accessToken),
            );
          }
        } else {
          if (__DEV__) {
            Logger.warn(
              "⚠️ [AuthContext] Access Token만 존재 - Refresh Token 없음",
            );
          }
          await clearTokens();
        }
      } else {
        if (__DEV__) {
          Logger.info("ℹ️ [AuthContext] 저장된 토큰 없음 - 비로그인 상태");
        }
      }
    } catch (error) {
      Logger.error("[AuthContext] 토큰 로드 실패:", error);
      await clearTokens();
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

      // 🚨 3단계: 로그인 페이로드 정제 (trim 처리)
      const trimmedCredentials = {
        email: credentials.email.trim(),
        password: credentials.password.trim(),
      };

      const response = await authSigninAPI(trimmedCredentials);

      // 🚨 방어 로직 추가: 통신 실패나 네트워크 에러로 undefined가 들어왔을 때 크래시 방지
      if (!response) {
        Logger.error(
          "로그인 실패: 서버로부터 응답을 받지 못했습니다 (API 에러 로그 확인).",
        );
        return false;
      }

      if (response.resultType === "SUCCESS" && response.data) {
        const tokenData = response.data;

        if (!tokenData.accessToken || !tokenData.refreshToken) {
          Logger.error(
            "🚨 [파싱 실패] 토큰 정보가 불완전합니다. 현재 구조:",
            JSON.stringify(response, null, 2),
          );
          return false;
        }

        // TokenStore에 토큰 저장
        const success = await setTokens(
          tokenData.accessToken,
          tokenData.refreshToken,
        );
        if (!success) {
          Logger.error("토큰 저장 실패");
          return false;
        }

        // 디버깅 로그: 토큰 저장 상태 확인
        Logger.debug(
          "✅ [AuthContext] 토큰 저장 성공",
          maskSensitive(tokenData.accessToken),
        );
        Logger.debug("- Access Token 길이:", tokenData.accessToken.length);
        Logger.debug("- Refresh Token 길이:", tokenData.refreshToken.length);

        // 상태 업데이트
        const claim = getTokenClaimFromAccessToken(tokenData.accessToken);
        setUser({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          ...claim,
        });

        if (__DEV__) {
          Logger.debug(
            "✅ [AuthContext] 사용자 상태 업데이트 완료 - 로그인 성공",
          );
        }

        return true;
      } else {
        Logger.error("로그인 실패:", response.error?.message);
        return false;
      }
    } catch (error) {
      Logger.error("로그인 에러:", error);
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

      // 🚨 방어 로직 추가: 통신 실패나 네트워크 에러로 undefined가 들어왔을 때 크래시 방지
      if (!response) {
        Logger.error(
          "API 통신 실패: response가 반환되지 않았습니다. 네트워크 연결을 확인하세요.",
        );
        return false;
      }

      if (response.resultType === "SUCCESS" && response.data) {
        // 회원가입 성공 후 자동 로그인
        const loginSuccess = await signin({
          email: userData.email,
          password: userData.password,
        });

        if (loginSuccess) {
          return true;
        } else {
          Logger.error("회원가입 후 자동 로그인 실패");
          return false;
        }
      } else {
        Logger.error("회원가입 실패:", response.error?.message);
        return false;
      }
    } catch (error) {
      Logger.error("회원가입 에러:", error);
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
      // 현재 리프레시 토큰 가져오기
      const currentRefreshToken = await getRefreshToken();

      if (currentRefreshToken) {
        // 서버에 로그아웃 통보 (실패하더라도 로컬 정리는 진행)
        await authSignoutAPI(currentRefreshToken);
      }
    } catch (error) {
      Logger.error("서버 로그아웃 통보 실패:", error);
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
