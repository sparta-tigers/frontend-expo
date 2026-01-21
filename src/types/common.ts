/**
 * 공통 타입 정의
 * 전체 애플리케이션에서 사용하는 기본 타입들
 */

/**
 * 기본 API 응답 인터페이스
 * 모든 API 응답의 표준 형식
 */
export interface BaseApiResponse<T = any> {
  resultType: "SUCCESS" | "ERROR";
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  timestamp: string;
}

/**
 * 페이징 정보 인터페이스
 * 목록 조회 API의 표준 페이징 구조
 */
export interface PageInfo {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * 페이징 응답 인터페이스
 * 페이징 처리된 데이터의 표준 형식
 */
export interface PaginatedResponse<T> extends BaseApiResponse<T[]> {
  pagination: PageInfo;
}

/**
 * ID 기반 엔티티 인터페이스
 * 모든 도메인 엔티티의 기본 구조
 */
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 사용자 정보 기본 인터페이스
 * 여러 도메인에서 공통으로 사용하는 사용자 정보
 */
export interface BaseUser {
  userId: number;
  nickname: string;
  userNickname?: string; // 하위 호환성 유지
}

/**
 * 위치 정보 인터페이스
 * 지도 관련 기능에서 사용하는 표준 위치 정보
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * 비동기 작업 상태 타입
 * 로딩, 성공, 실패 상태 관리
 */
export type AsyncStatus = "idle" | "loading" | "success" | "error";

/**
 * 비동기 작업 상태 인터페이스
 */
export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

/**
 * API 요청 결과 타입
 * 성공/실패 처리를 위한 공용 타입
 */
export type RequestResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
