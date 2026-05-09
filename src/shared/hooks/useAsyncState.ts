import { AsyncState, RequestResult } from "@/src/shared/types/common";
import { useCallback, useRef, useState } from "react";

/**
 * 비동기 상태 관리 훅
 * API 호출 등 비동기 작업의 상태를 일관되게 관리
 *
 * [RC-1/EB-2] Race Condition 방어:
 * - statusRef: state.status를 deps 없이 최신 값으로 참조 (연쇄 리렌더 방지)
 * - execute는 새 Promise가 들어올 때마다 토큰(executionId)을 발급하고,
 *   완료 시점에 토큰이 일치하지 않으면(= 더 최신 요청이 있으면) 결과를 버린다.
 */
export function useAsyncState<T>(
  initialData: T | null = null,
): [AsyncState<T>, (promise: Promise<T>) => Promise<void>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: initialData,
    error: null,
  });

  // [RC-1] 최신 status를 deps 없이 참조하기 위한 ref
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  // [RC-1] 실행 토큰 — 새 Promise가 올 때마다 증가.
  // 완료 시점에 토큰이 현재와 다르면 더 최신 요청이 있으므로 결과를 버린다.
  const executionIdRef = useRef(0);

  const execute = useCallback(async (promise: Promise<T>) => {
    // 이미 로딩 중이면 추가 호출 방지 (ref로 읽으므로 deps 불필요)
    if (statusRef.current === "loading") return;

    // 이 실행에 고유 토큰 발급
    const myId = ++executionIdRef.current;

    setState((prev: AsyncState<T>) => ({
      ...prev,
      status: "loading",
      error: null,
    }));

    try {
      const data = await promise;

      // [RC-1] 토큰 불일치 = 더 최신 요청이 이미 실행 중 → 결과 버림
      if (myId !== executionIdRef.current) return;

      setState({ status: "success", data, error: null });
    } catch (error) {
      // 토큰 불일치 시 에러도 버림
      if (myId !== executionIdRef.current) return;

      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      setState({ status: "error", data: null, error: errorMessage, rawError: error });
    }
  // [EB-2] deps: [] — 함수 참조를 고정하여 연쇄 리렌더 방지
  }, []);

  const reset = useCallback(() => {
    // reset 시 토큰도 증가 → 진행 중이던 요청 결과를 버림 (탭 전환 방어)
    executionIdRef.current += 1;
    setState({ status: "idle", data: initialData, error: null });
  // initialData는 훅 선언 시 1회만 평가되므로 deps 유지
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
