import {
  authSigninAPI,
  authSignoutAPI,
  authSignupAPI,
} from "@/src/features/auth/api";
import {
  AuthSigninRequest,
  AuthSignupRequest,
} from "@/src/features/auth/types";
import {
  favoriteTeamAddAPI,
  favoriteTeamGetAPI,
  favoriteTeamUpdateAPI,
} from "@/src/features/user/favorite-team-api";
import { TEAM_DATA } from "@/src/utils/team";
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
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getMyTeamKey = (userId?: number) =>
  userId ? `yaguniv_my_team_${userId}` : "yaguniv_my_team_guest";

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
  myTeam: string | null;
  signin: (credentials: AuthSigninRequest) => Promise<boolean>;
  signup: (userData: AuthSignupRequest) => Promise<boolean>;
  signout: () => Promise<void>;
  loadToken: () => Promise<void>;
  updateMyTeam: (teamName: string) => Promise<void>;
  updateUser: (partialUser: Partial<SimpleToken>) => void;
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SimpleToken | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [myTeam, setMyTeam] = useState<string | null>(null);

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
      }

      if (accessToken) {
        const refreshToken = await getRefreshToken();

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
          
          // 🚨 [Data Sync] 1. 백엔드에서 응원팀 정보 우선 조회
          try {
            const teamRes = await favoriteTeamGetAPI();
            if (teamRes.resultType === "SUCCESS" && teamRes.data) {
              const backendTeamCode = teamRes.data.teamCode;
              // 백엔드 코드(HT) -> 프론트엔드 코드(KIA) 역매핑 찾기
              const frontendTeamCode = Object.entries(TEAM_DATA).find(
                ([_, data]) => data.backendCode === backendTeamCode
              )?.[0];
              
              if (frontendTeamCode) {
                setMyTeam(frontendTeamCode);
                await AsyncStorage.setItem(getMyTeamKey(tokenPayload.userId), frontendTeamCode);
              }
            } else {
              // 백엔드에 없으면 로컬 스토리지 확인
              const savedTeam = await AsyncStorage.getItem(getMyTeamKey(tokenPayload.userId));
              if (savedTeam) {
                setMyTeam(savedTeam);
                // 🚨 [Data Sync] 백엔드에 자동 등록 시도
                const backendCode = TEAM_DATA[savedTeam]?.backendCode;
                if (backendCode) {
                  await favoriteTeamAddAPI({ teamCode: backendCode });
                }
              }
            }
          } catch {
            // API 실패 시 로컬 스토리지로 폴백
            const savedTeam = await AsyncStorage.getItem(getMyTeamKey(tokenPayload.userId));
            if (savedTeam) {
              setMyTeam(savedTeam);
            }
          }

          if (__DEV__) {
            Logger.debug("✅ [AuthContext] 토큰 및 사용자 환경 설정 로드 성공");
          }
        } else {
          await clearTokens();
        }
      } else {
        // 비로그인 상태의 게스트 팀 정보 로드
        const guestTeam = await AsyncStorage.getItem(getMyTeamKey(undefined));
        if (guestTeam) {
          setMyTeam(guestTeam);
        }
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
          Logger.error("🚨 [파싱 실패] 토큰 정보가 불완전합니다.");
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
      const currentRefreshToken = await getRefreshToken();
      if (currentRefreshToken) {
        await authSignoutAPI(currentRefreshToken);
      }
    } catch (error) {
      Logger.error("서버 로그아웃 통보 실패:", error);
    } finally {
      // 🚨 [Auth Stability] 1. React Query 캐시 즉시 초기화 (이전 사용자 데이터 제거)
      queryClient.clear();

      // 2. TokenStore 및 상태 초기화
      await clearTokens();
      setUser(null);
      setMyTeam(null);
    }
  };

  /**
   * 응원팀 업데이트 함수 (Optimistic Update)
   * 
   * @param teamName - 변경할 팀 명칭
   */
  const updateMyTeam = async (teamName: string): Promise<void> => {
    const previousTeam = myTeam;
    try {
      // 1. 로그인 상태라면 백엔드와 동기화 시도
      if (isLoggedIn && user?.userId) {
        const backendCode = TEAM_DATA[teamName]?.backendCode;
        if (backendCode) {
          let teamExists = false;
          try {
            const checkRes = await favoriteTeamGetAPI();
            teamExists = checkRes.resultType === "SUCCESS" && !!checkRes.data;
          } catch {
            teamExists = false;
          }
          
          if (teamExists) {
            await favoriteTeamUpdateAPI({ teamCode: backendCode });
          } else {
            await favoriteTeamAddAPI({ teamCode: backendCode });
          }
        }
      }

      // 🚨 [State Sync] 백엔드 호출 성공 후 상태 업데이트 및 쿼리 무효화
      // Why: 상태 업데이트가 먼저 일어나야 HomeScreen에서 구독 중인 myTeamId가 변경되고, 
      // 그에 따라 리액트 쿼리가 새로운 teamId를 포함한 키로 패칭을 시작하는 자연스러운 흐름이 완성됨.
      
      // 2. UI 및 로컬 스토리지 업데이트
      setMyTeam(teamName);
      await AsyncStorage.setItem(getMyTeamKey(user?.userId), teamName);
      
      // 3. 경기 일정 쿼리 무효화 (안전장치)
      await queryClient.invalidateQueries({ queryKey: ["matches", "schedule"] });

      if (__DEV__) {
        Logger.debug(`✅ [AuthContext] 응원팀 변경 및 데이터 동기화 완료: ${teamName}`);
      }
    } catch (error) {
      Logger.error("[AuthContext] 응원팀 변경 실패:", error);
      setMyTeam(previousTeam);
      Alert.alert("알림", "팀 정보를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };
  
  /**
   * 사용자 정보 부분 업데이트 함수
   * 닉네임 등 변경된 정보만 유저 상태에 병합 (토큰 등 기존 정보 보호)
   * 
   * @param partialUser - 업데이트할 사용자 정보 조각
   */
  const updateUser = (partialUser: Partial<SimpleToken>): void => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...partialUser,
      };
    });
    
    if (__DEV__) {
      Logger.debug("✅ [AuthContext] 사용자 정보 부분 업데이트 완료", partialUser);
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
    myTeam,
    signin,
    signup,
    signout,
    loadToken,
    updateMyTeam,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
