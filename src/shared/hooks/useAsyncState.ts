import { AsyncState, RequestResult } from "@/src/types/common";
import { useCallback, useState } from "react";

/**
 * 비동기 상태 관리 훅
 * API 호출 등 비동기 작업의 상태를 일관되게 관리
 */
export function useAsyncState<T>(
  initialData: T | null = null,
): [AsyncState<T>, (promise: Promise<T>) => Promise<void>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: initialData,
    error: null,
  });

  const execute = useCallback(
    async (promise: Promise<T>) => {
      // 이미 로딩 중이면 추가 호출 방지 (무한 루프 방지)
      if (state.status === "loading") {
        return;
      }

      setState((prev: AsyncState<T>) => ({
        ...prev,
        status: "loading",
        error: null,
      }));

      try {
        const data = await promise;
        setState({
          status: "success",
          data,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "알 수 없는 오류";
        setState({
          status: "error",
          data: null,
          error: errorMessage,
        });
      }
    },
    [state.status],
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      data: initialData,
      error: null,
    });
  }, [initialData]);

  return [state, execute, reset];
}

/**
 * API 요청 결과 처리 훅
 * RequestResult 타입을 활용한 API 응답 처리
 */
export function useApiRequest<T>(): [
  RequestResult<T> | null,
  (promise: Promise<T>) => Promise<RequestResult<T>>,
  () => void,
] {
  const [result, setResult] = useState<RequestResult<T> | null>(null);

  const execute = useCallback(
    async (promise: Promise<T>): Promise<RequestResult<T>> => {
      try {
        const data = await promise;
        const successResult: RequestResult<T> = { success: true, data };
        setResult(successResult);
        return successResult;
      } catch (error) {
        const errorResult: RequestResult<T> = {
          success: false,
          data: result as T,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        };
        setResult(errorResult);
        return errorResult;
      }
    },
    [result],
  );

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return [result, execute, reset];
}
