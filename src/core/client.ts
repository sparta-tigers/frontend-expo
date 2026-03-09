import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/src/utils/tokenStore";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { Platform } from "react-native";

/**
 * Mutex 상태 변수 (Race Condition 방지)
 */
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (error: any) => void;
}[] = [];

/**
 * 대기 중인 요청들 처리
 * @param token - 새로운 액세스 토큰
 * @param error - 에러 (실패 시)
 */
const processQueue = (token?: string, error?: any) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });

  failedQueue = [];
};

/**
 * 동적 API Base URL 설정
 * 개발 환경의 안드로이드 에뮬레이터에서는 10.0.2.2로 강제 설정
 */
const getDynamicBaseURL = (): string => {
  // 기본값: 환경변수 또는 localhost
  let baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080";

  // 개발 환경의 안드로이드 에뮬레이터용 핫픽스
  if (__DEV__ && Platform.OS === "android") {
    baseURL = "http://10.0.2.2:8080";
  }

  return baseURL;
};

/**
 * 순환 의존성 방지를 위한 bare axios 인스턴스
 * 토큰 갱신 요청에만 사용 (인터셉터 없음)
 */
const bareAxios = axios.create({
  baseURL: getDynamicBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 메인 axios 인스턴스
 * 토큰 자동 관리 및 갱신 로직 포함
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getDynamicBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 요청 인터셉터: TokenStore에서 accessToken 가져와 헤더에 추가
 */
// 🚨 앙드레 카파시: 토큰 검증 캐싱 시스템
const tokenValidationCache = new Map<string, boolean>();
const TOKEN_CACHE_MAX_SIZE = 100;

/**
 * JWT 토큰 형식 검증
 * @param token - 검증할 JWT 토큰
 * @returns 형식 유효 여부
 */
export const validateTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== "string") return false;

  try {
    // JWT 기본 구조 검증 (header.payload.signature)
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // 각 부분이 base64url 인코딩되었는지 검증
    parts.forEach((part) => {
      // base64url 패딩 추가
      const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
      // base64url -> base64 변환 후 디코딩 테스트
      const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
      atob(base64);
    });

    return true;
  } catch {
    return false;
  }
};

/**
 * 캐싱된 토큰 검증
 * 동일한 토큰의 반복 검증을 방지하여 성능 최적화
 */
const validateTokenFormatCached = (token: string): boolean => {
  // 캐시에서 결과 확인
  if (tokenValidationCache.has(token)) {
    return tokenValidationCache.get(token)!;
  }

  // 캐시 크기 제한 (LRU 방식)
  if (tokenValidationCache.size >= TOKEN_CACHE_MAX_SIZE) {
    const firstKey = tokenValidationCache.keys().next().value;
    if (firstKey) {
      tokenValidationCache.delete(firstKey);
    }
  }

  // 토큰 검증 및 캐싱
  const isValid = validateTokenFormat(token);
  tokenValidationCache.set(token, isValid);

  return isValid;
};

/**
 * 중요 API 엔드포인트 여부 확인
 * 중요한 API 호출 시에만 상세 로그 출력
 */
const shouldLogTokenValidation = (url?: string): boolean => {
  if (!url) return false;

  const criticalEndpoints = [
    "/api/v1/auth/",
    "/api/v1/items",
    "/api/v1/users/me",
  ];

  return criticalEndpoints.some((endpoint) => url.includes(endpoint));
};

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        // 🚨 앙드레 카파시: 캐싱된 토큰 검증
        const isTokenValid = validateTokenFormatCached(accessToken);

        if (!isTokenValid) {
          console.error(
            "🚨 [Invalid Token Format] 비정상 형식의 토큰:",
            accessToken.substring(0, 50),
          );
          // 토큰 형식이 비정상이면 요청 중단 및 토큰 클리어
          await clearTokens();
          return Promise.reject(new Error("Invalid token format"));
        }

        config.headers.Authorization = `Bearer ${accessToken}`;

        // 🚨 앙드레 카파시: 조건부 디버깅 로그
        if (__DEV__ && shouldLogTokenValidation(config.url)) {
          console.log(
            "🔍 [Authorization Header]",
            config.headers.Authorization,
          );
          console.log("🔍 [Token Length]", accessToken.length);
          console.log(
            "🔍 [Token Format]",
            accessToken.startsWith("eyJ") ? "JWT 형식" : "비정상 형식",
          );
          console.log(
            "🔍 [Token Validation]",
            isTokenValid ? "✅ 유효" : "❌ 무효",
          );
        }
      } else {
        // 🚨 토큰 없음 경고 (중요 API 호출 시만)
        if (__DEV__ && shouldLogTokenValidation(config.url)) {
          console.warn("⚠️ [Token Missing] 액세스 토큰이 없습니다.");
        }
      }
    } catch (error) {
      console.error("토큰 조회 실패:", error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * 응답 인터셉터: 401 에러 시 Mutex로 토큰 갱신
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      // 이미 갱신 중이면 큐에 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // 갱신 시작
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // bare axios로 갱신 요청 (순환 의존성 방지)
        const refreshResponse = await bareAxios.post("/api/v1/auth/refresh", {
          refreshToken,
        });

        if (
          refreshResponse.data?.resultType === "SUCCESS" &&
          refreshResponse.data?.data
        ) {
          const tokenData = refreshResponse.data.data;

          // TokenStore에 새 토큰 저장
          const success = await setTokens(
            tokenData.accessToken,
            tokenData.refreshToken,
          );
          if (!success) {
            throw new Error("Failed to save new tokens");
          }

          // 대기 중인 요청들 처리
          processQueue(tokenData.accessToken);

          // 원래 요청 재시도
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`;
          }
          return axiosInstance(originalRequest);
        } else {
          throw new Error("Refresh token response invalid");
        }
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);

        // 토큰 삭제
        await clearTokens();

        // 대기 중인 요청들 모두 실패 처리
        processQueue(undefined, refreshError);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * API 요청 래퍼 함수들
 */
export const apiClient = {
  /**
   * GET 요청
   */
  get: async <T = any>(
    url: string,
    params?: Record<string, any>,
  ): Promise<T> => {
    try {
      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`GET ${url} 요청 실패:`, error);
      // 🚨 에러를 다시 던져서 AuthContext에서 처리할 수 있도록 함
      throw error;
    }
  },

  /**
   * POST 요청
   */
  post: async <T = any>(
    url: string,
    data?: Record<string, any>,
  ): Promise<T> => {
    try {
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} 요청 실패:`, error);
      // 🚨 에러를 다시 던져서 AuthContext에서 처리할 수 있도록 함
      throw error;
    }
  },

  /**
   * PUT 요청
   */
  put: async <T = any>(url: string, data?: Record<string, any>): Promise<T> => {
    try {
      const response = await axiosInstance.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} 요청 실패:`, error);
      // 🚨 에러를 다시 던져서 AuthContext에서 처리할 수 있도록 함
      throw error;
    }
  },

  /**
   * DELETE 요청
   */
  delete: async <T = any>(url: string): Promise<T> => {
    try {
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} 요청 실패:`, error);
      // 🚨 에러를 다시 던져서 AuthContext에서 처리할 수 있도록 함
      throw error;
    }
  },

  /**
   * PATCH 요청
   */
  patch: async <T = any>(
    url: string,
    data?: Record<string, any>,
  ): Promise<T> => {
    try {
      const response = await axiosInstance.patch(url, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH ${url} 요청 실패:`, error);
      // 🚨 에러를 다시 던져서 AuthContext에서 처리할 수 있도록 함
      throw error;
    }
  },

  /**
   * 원본 axios 인스턴스 (고급 사용용)
   */
  instance: axiosInstance,
};
