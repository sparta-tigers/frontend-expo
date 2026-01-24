import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../utils/tokenStore";

/**
 * Mutex 상태 변수 (Race Condition 방지)
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error: any) => void;
}> = [];

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
 * 순환 의존성 방지를 위한 bare axios 인스턴스
 * 토큰 갱신 요청에만 사용 (인터셉터 없음)
 */
const bareAxios = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080",
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
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 요청 인터셉터: TokenStore에서 accessToken 가져와 헤더에 추가
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error("토큰 조회 실패:", error);
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
  get: async <T>(url: string, params?: Record<string, any>) => {
    const response = await axiosInstance.get(url, { params });
    return response.data;
  },

  /**
   * POST 요청
   */
  post: async <T>(url: string, data?: Record<string, any>) => {
    const response = await axiosInstance.post(url, data);
    return response.data;
  },

  /**
   * PUT 요청
   */
  put: async <T>(url: string, data?: Record<string, any>) => {
    const response = await axiosInstance.put(url, data);
    return response.data;
  },

  /**
   * DELETE 요청
   */
  delete: async <T>(url: string) => {
    const response = await axiosInstance.delete(url);
    return response.data;
  },

  /**
   * PATCH 요청
   */
  patch: async <T>(url: string, data?: Record<string, any>) => {
    const response = await axiosInstance.patch(url, data);
    return response.data;
  },

  /**
   * 원본 axios 인스턴스 (고급 사용용)
   */
  instance: axiosInstance,
};
