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
  /** 스토리지 제한에 걸릴 경우 오래된 데이터부터 삭제하는 로직 (기본값 활용) */
  throttleTime: 1000,
});
