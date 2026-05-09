/**
 * 공용 API 응답 타입
 * 제네릭을 활용하여 모든 API 응답의 일관된 구조 보장
 */
export interface ApiResponse<T> {
  resultType: "SUCCESS" | "ERROR";
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  timestamp: string;
}

/**
 * 공용 페이징 타입
 * 제네릭을 활용하여 모든 목록 데이터의 일관된 구조 보장
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements?: number;
  empty: boolean;
}

/**
 * 공용 에러 타입
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 유틸리티 타입: 주어진 키 중 적어도 하나는 필수인 객체 타입
 * 
 * Why: 서버 요청 DTO 등에서 여러 필드 중 최소 하나 이상의 값이 반드시 존재해야 함을 보장하여,
 * 런타임에서의 데이터 누락으로 인한 예기치 못한 API 오류를 컴파일 타임에 예방하기 위함.
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * 비동기 상태 타입
 * 제네릭을 활용하여 모든 비동기 작업의 일관된 상태 관리
 */
export interface AsyncState<T> {
  status: "idle" | "loading" | "success" | "error";
  data: T | null;
  error: string | null;
  rawError?: unknown; // 🚨 [Senior Architect] 원본 에러 객체 보관 (Zero-Magic 추적용)
}

/**
 * 요청 결과 타입
 * useAsyncState 훅에서 사용되는 내부 타입
 */
export interface RequestResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * 비동기 상태 생성 유틸리티
 */
export const createAsyncState = <T>(initialData?: T): AsyncState<T> => ({
  status: "idle",
  data: initialData || null,
  error: null,
});

/**
 * 성공 상태 생성 유틸리티
 */
export const createSuccessState = <T>(data: T): AsyncState<T> => ({
  status: "success",
  data,
  error: null,
});

/**
 * 에러 상태 생성 유틸리티
 */
export const createErrorState = <T>(error: string): AsyncState<T> => ({
  status: "error",
  data: null,
  error,
});

/**
 * 로딩 상태 생성 유틸리티
 */
export const createLoadingState = <T>(previousData?: T): AsyncState<T> => ({
  status: "loading",
  data: previousData || null,
  error: null,
});
