import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AxiosInstance } from "axios";
import axios from "axios";

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
export type ResultType = [keyof typeof ResultType];

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
  resultType: ResultType;
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

    // 요청 인터셉터: AsyncStorage의 accessToken을 자동으로 헤더에 추가
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const accessToken = await AsyncStorage.getItem("accessToken");
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
