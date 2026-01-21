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

// client.ts에서 구현된 ApiClient 가져오기
export { apiClient } from "./client";
