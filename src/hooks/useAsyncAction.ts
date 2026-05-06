import { useCallback, useState } from "react";
import { Logger } from "@/src/utils/logger";

interface AsyncActionOptions<T> {
  /** 성공 시 콜백 */
  onSuccess?: (data: T) => void;
  /** 에러 시 콜백 */
  onError?: (error: Error) => void;
  /** 에러 발생 시 Alert 표시 여부 (기본값: true) */
  showAlert?: boolean;
}

/**
 * 비동기 액션 래퍼 훅
 * 
 * Why: 비동기 작업의 생명주기(Loading, Error)를 일관되게 관리하고,
 * 반복되는 try-catch 블록과 에러 로깅 로직을 추상화하여 비즈니스 로직의 응집도를 높이기 위해 설계함.
 * 앙드레 카파시의 '결정론적 상태 흐름' 철학을 반영하여 상태 변경을 명시적으로 제어함.
 */
export const useAsyncAction = <T, Args extends any[]>(
  action: (...args: Args) => Promise<T>,
  options: AsyncActionOptions<T> = { showAlert: true }
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: Args): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await action(...args);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      setError(errorInstance);
      
      // 🚨 앙드레 카파시: 전역 로거 연동
      Logger.error("🚨 [AsyncAction Error]:", errorInstance);
      
      options.onError?.(errorInstance);
      
      // 필요한 경우 여기서 토스트 알림 등 공통 UI 처리 가능
      
      throw errorInstance; // 상위에서 에러를 다시 잡을 수 있도록 재투척
    } finally {
      setIsLoading(false);
    }
  }, [action, options]);

  return {
    execute,
    isLoading,
    error,
    /** 에러 상태 초기화 함수 */
    resetError: () => setError(null),
  };
};
