import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { authRefreshTokenAPI } from "./auth";

/**
 * API 응답 결과 타입 상수
 * - SUCCESS: API 호출 성공
 * - ERROR: API 호출 실패
 */
export const ResultType = {
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
} as const;

/**
 * API 응답 결과 타입
 * Java의 Enum과 유사한 역할
 */
export type ApiResultType = keyof typeof ResultType;

/**
 * API 에러 응답 인터페이스
 * Java의 DTO(Data Transfer Object)와 동일한 역할
 */
export interface ErrorResponse {
  code: string;
  message: string;
  data?: never;
}

/**
 * 표준 API 응답 인터페이스
 * 모든 API 호출의 응답 형식을 통일
 *
 * @template T - 응답 데이터의 타입 (Java Generic과 유사)
 */
export interface ApiResponse<T> {
  resultType: ApiResultType;
  data: T | null;
  error: ErrorResponse | null;
  timestamp: string;
}

/**
 * API 클라이언트 클래스
 * 백엔드 API와의 통신을 담당하는 핵심 클래스
 * - JWT 토큰 자동 관리
 * - 에러 처리 통합
 * - 타임아웃 설정
 */
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 요청 인터셉터: SecureStore의 accessToken을 자동으로 헤더에 추가
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const accessToken = await SecureStore.getItemAsync("accessToken");
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

    // 응답 인터셉터: 401 에러 시 자동 토큰 갱신
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureStore.getItemAsync("refreshToken");
            if (refreshToken) {
              const refreshResponse = await authRefreshTokenAPI(refreshToken);

              if (
                refreshResponse.resultType === ResultType.SUCCESS &&
                refreshResponse.data
              ) {
                const tokenData = refreshResponse.data;

                // 새 토큰 저장
                await SecureStore.setItemAsync(
                  "accessToken",
                  tokenData.accessToken,
                );
                await SecureStore.setItemAsync(
                  "refreshToken",
                  tokenData.refreshToken,
                );
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

                // 원래 요청 재시도
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`;
                }
                return this.axiosInstance(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error("토큰 갱신 실패:", refreshError);
          }

          // 리프레시 실패 시 토큰 삭제
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("refreshToken");
          await SecureStore.deleteItemAsync("accessTokenIssuedAt");
          await SecureStore.deleteItemAsync("accessTokenExpiredAt");
          await SecureStore.deleteItemAsync("refreshTokenIssuedAt");
          await SecureStore.deleteItemAsync("refreshTokenExpiredAt");
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * GET 요청 메서드
   * @param url - API 엔드포인트
   * @param params - 쿼리 파라미터
   * @returns 타입화된 응답 데이터
   */
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get(url, { params });
    return response.data;
  }

  /**
   * POST 요청 메서드
   * @param url - API 엔드포인트
   * @param data - 요청 바디
   * @returns 타입화된 응답 데이터
   */
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post(url, data);
    return response.data;
  }

  /**
   * PUT 요청 메서드
   * @param url - API 엔드포인트
   * @param data - 요청 바디
   * @returns 타입화된 응답 데이터
   */
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put(url, data);
    return response.data;
  }

  /**
   * DELETE 요청 메서드
   * @param url - API 엔드포인트
   * @returns 타입화된 응답 데이터
   */
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete(url);
    return response.data;
  }

  /**
   * PATCH 요청 메서드
   * @param url - API 엔드포인트
   * @param data - 요청 바디
   * @returns 타입화된 응답 데이터
   */
  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch(url, data);
    return response.data;
  }
}

/**
 * 전역 API 클라이언트 인스턴스
 * 앱 전체에서 공통으로 사용하는 API 클라이언트
 */
export const apiClient = new ApiClient();
