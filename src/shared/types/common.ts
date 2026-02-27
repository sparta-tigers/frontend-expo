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
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

/**
 * 공용 에러 타입
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * 비동기 상태 타입
 * 제네릭을 활용하여 모든 비동기 작업의 일관된 상태 관리
 */
export interface AsyncState<T> {
  status: "idle" | "loading" | "success" | "error";
  data: T | null;
  error: string | null;
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
