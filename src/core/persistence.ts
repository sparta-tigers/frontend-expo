import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/**
 * AsyncStorage 기반 Persister
 * 
 * Why: Expo Go 환경에서 네이티브 모듈 컴파일 없이 안정적으로 동작하며,
 * 앱 재시작 시에도 React Query의 캐시를 복구하여 오프라인 대응력을 높이기 위해 정의함.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  /** 캐시 키 (애플리케이션별 고유 키 권장) */
  key: "YAGUNIV_QUERY_CACHE",
  /** AsyncStorage에 캐시를 저장할 때 쓰기 빈도를 제한하는 옵션 (기본값 1000ms) */
  throttleTime: 1000,
});
