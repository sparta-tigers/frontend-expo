/**
 * 교환 화면 아이템 목록/필터 관련 로직 훅
 *
 * Why: exchange.tsx에서 아이템 페칭, 필터링, 새로고침 로직을 분리.
 * 핵심 개선: loadItems의 itemsState.data 의존성을 제거하여
 * 데이터 변경 → 함수 재생성 → Effect 재실행 순환을 차단.
 */
import { itemsGetListAPI } from "@/src/features/exchange/api";
import { Item } from "@/src/features/exchange/types";
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { Logger } from "@/src/utils/logger";
import { useCallback, useMemo, useState } from "react";

/** 카테고리 필터 타입 */
type CategoryFilter = "ALL" | "TICKET" | "GOODS";

/** useExchangeItems 훅의 반환 타입 */
export interface UseExchangeItemsReturn {
  /** useAsyncState의 상태 (status, data, error) */
  itemsState: ReturnType<typeof useAsyncState<Item[]>>[0];
  /** 선택된 카테고리 필터 */
  selectedCategory: CategoryFilter;
  /** 카테고리 필터 변경 */
  setSelectedCategory: (category: CategoryFilter) => void;
  /** 필터링 적용된 아이템 목록 */
  filteredItems: Item[];
  /** 새로고침 중 여부 */
  refreshing: boolean;
  /** 초기 데이터 로딩 완료 여부 */
  isInitialFetched: boolean;
  /** 새로고침 핸들러 (지도 영역 기반) */
  handleRefresh: (lat: number, lng: number, latDelta: number) => Promise<void>;
  /** 지도 영역 기반 아이템 검색 */
  searchByRegion: (lat: number, lng: number, latDelta: number) => Promise<void>;
  /** 초기 GPS 기반 아이템 로딩 */
  fetchInitialItems: (lat: number, lng: number, latDelta: number) => Promise<void>;
}

/**
 * 아이템 목록 관리 훅
 *
 * loadItems는 deps를 빈 배열로 유지하여 함수 참조가 고정됨.
 * 페이지네이션(append) 시에는 setState(prev => ...) 패턴으로 처리.
 */
export function useExchangeItems(): UseExchangeItemsReturn {
  const [itemsState, fetchItems] = useAsyncState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialFetched, setIsInitialFetched] = useState(false);

  /**
   * API에서 아이템 목록을 가져오는 순수 함수
   *
   * Why: 이전 구현에서는 itemsState.data를 useCallback deps에 포함시켜
   * 데이터 변경 → 함수 재생성 → Effect 재실행 순환이 발생했다.
   * 새 구현에서는 API 결과만 반환하고, 병합은 호출자가 처리한다.
   */
  const loadItems = useCallback(
    async (
      lat: number,
      lng: number,
      radiusKm: number,
    ): Promise<Item[]> => {
      const response = await itemsGetListAPI(
        0,     // pageNum — 현재 0페이지만 사용
        10,
        undefined,
        undefined,
        lat,
        lng,
        radiusKm,
      );

      if (response.resultType === "SUCCESS" && response.data) {
        const { content } = response.data;
        // 교환 완료된 아이템 필터링
        return content.filter((item: Item) => item.status !== "COMPLETED");
      }

      return [];
    },
    [], // ← deps 없음! API 호출 파라미터만으로 결과가 결정됨
  );

  /** 지도 영역의 latDelta → km 반경 변환 */
  const deltaToRadius = (latDelta: number): number => latDelta * 111;

  /** 새로고침 핸들러 */
  const handleRefresh = useCallback(
    async (lat: number, lng: number, latDelta: number) => {
      setRefreshing(true);
      try {
        const radius = deltaToRadius(latDelta);
        await fetchItems(loadItems(lat, lng, radius));
      } catch (error) {
        Logger.error("새로고침 실패:", error);
      } finally {
        setRefreshing(false);
      }
    },
    [fetchItems, loadItems],
  );

  /** 현 지도에서 재검색 */
  const searchByRegion = useCallback(
    async (lat: number, lng: number, latDelta: number) => {
      setRefreshing(true);
      try {
        const radius = deltaToRadius(latDelta);
        await fetchItems(loadItems(lat, lng, radius));
        Logger.debug("현 지도에서 재검색 완료", {
          lat,
          lng,
          radius,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        Logger.error("현 지도에서 재검색 실패:", error);
        throw error; // 호출자에서 isMapMoved 복구 처리
      } finally {
        setRefreshing(false);
      }
    },
    [fetchItems, loadItems],
  );

  /** 초기 GPS 기반 아이템 로딩 (1회 실행) */
  const fetchInitialItems = useCallback(
    async (lat: number, lng: number, latDelta: number) => {
      const radius = deltaToRadius(latDelta);
      await fetchItems(loadItems(lat, lng, radius));
      setIsInitialFetched(true);
      Logger.debug("[Map-First] 초기 GPS 기반 아이템 로딩 완료", { lat, lng });
    },
    [fetchItems, loadItems],
  );

  /** 필터링 적용된 아이템 목록 */
  const filteredItems = useMemo(() => {
    if (!itemsState.data) return [];
    if (selectedCategory === "ALL") return itemsState.data;
    return itemsState.data.filter((item) => item.category === selectedCategory);
  }, [itemsState.data, selectedCategory]);

  return {
    itemsState,
    selectedCategory,
    setSelectedCategory,
    filteredItems,
    refreshing,
    isInitialFetched,
    handleRefresh,
    searchByRegion,
    fetchInitialItems,
  };
}
