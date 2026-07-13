/**
 * 교환 화면 아이템 목록/필터 관련 로직 훅
 *
 * Why: exchange.tsx에서 아이템 페칭, 필터링, 새로고침 로직을 분리.
 * 핵심 개선: useAsyncState를 TanStack React Query로 마이그레이션하여
 * 캐싱, 자동 재요청, 상태 관리 최적화를 이룸 (S01).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { itemsGetListAPI } from '@/src/features/exchange/api';
import { Item } from '@/src/features/exchange/types';
import { Logger } from '@/src/utils/logger';
import { exchangeKeys } from '@/src/features/exchange/keys';

const mapLogger = Logger.category('MAP');

/** 카테고리 필터 타입 */
type CategoryFilter = 'ALL' | 'TICKET' | 'GOODS';

/** useExchangeItems 훅의 반환 타입 */
export interface UseExchangeItemsReturn {
  /** 호환성을 위해 유지된 상태 객체 */
  itemsState: {
    status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
    data: Item[];
    error: Error | null;
  };
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

/** 지도 영역의 latDelta → km 반경 변환 (1도 ≒ 111km) */
const deltaToRadius = (latDelta: number): number => latDelta * 111;

/**
 * 아이템 목록 관리 훅
 */
export function useExchangeItems(): UseExchangeItemsReturn {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<{
    lat: number;
    lng: number;
    radiusKm: number;
  } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialFetched, setIsInitialFetched] = useState(false);

  /**
   * API에서 아이템 목록을 가져오는 순수 함수
   */
  const loadItems = useCallback(
    async (lat: number, lng: number, radiusKm: number): Promise<Item[]> => {
      const response = await itemsGetListAPI(
        0, // pageNum — 현재 0페이지만 사용
        10,
        undefined,
        undefined,
        lat,
        lng,
        radiusKm,
      );

      if (response.resultType === 'SUCCESS' && response.data) {
        const { content } = response.data;
        // 교환 완료된 아이템 필터링
        return content.filter((item: Item) => item.status !== 'COMPLETED');
      }

      throw new Error(response.error?.message || '아이템 목록을 불러오지 못했어요.');
    },
    [],
  );

  // React Query를 통한 캐싱 및 페칭
  const query = useQuery({
    queryKey: exchangeKeys.list(searchParams?.lat, searchParams?.lng, searchParams?.radiusKm),
    queryFn: async () => {
      if (!searchParams) return [];
      return loadItems(searchParams.lat, searchParams.lng, searchParams.radiusKm);
    },
    enabled: !!searchParams,
    staleTime: 1000 * 60 * 5, // 5분 캐싱
  });

  // 명령형 페칭을 위한 액션
  const fetchItemsAction = useCallback(
    async (lat: number, lng: number, radiusKm: number) => {
      setSearchParams({ lat, lng, radiusKm });
      return queryClient.fetchQuery({
        queryKey: exchangeKeys.list(lat, lng, radiusKm),
        queryFn: () => loadItems(lat, lng, radiusKm),
        staleTime: 1000 * 60 * 5,
      });
    },
    [queryClient, loadItems],
  );

  /** 새로고침 핸들러 */
  const handleRefresh = useCallback(
    async (lat: number, lng: number, latDelta: number) => {
      setRefreshing(true);
      try {
        const radius = deltaToRadius(latDelta);
        await fetchItemsAction(lat, lng, radius);
      } catch (error) {
        mapLogger.error('새로고침 실패', error);
      } finally {
        setRefreshing(false);
      }
    },
    [fetchItemsAction],
  );

  /** 현 지도에서 재검색 */
  const searchByRegion = useCallback(
    async (lat: number, lng: number, latDelta: number) => {
      setRefreshing(true);
      try {
        const radius = deltaToRadius(latDelta);
        await fetchItemsAction(lat, lng, radius);
      } catch (error) {
        mapLogger.error('현 지도에서 재검색 실패', error);
        throw error; // 호출자에서 isMapMoved 복구 처리
      } finally {
        setRefreshing(false);
      }
    },
    [fetchItemsAction],
  );

  /** 초기 GPS 기반 아이템 로딩 (1회 실행) */
  const fetchInitialItems = useCallback(
    async (lat: number, lng: number, latDelta: number) => {
      try {
        const radius = deltaToRadius(latDelta);
        await fetchItemsAction(lat, lng, radius);
      } catch (error) {
        mapLogger.error('초기 아이템 로딩 실패', error);
        throw error;
      } finally {
        setIsInitialFetched(true);
      }
    },
    [fetchItemsAction],
  );

  // 기존 API 호환성을 위한 itemsState 매핑
  const itemsState = useMemo(() => {
    let status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR' = 'IDLE';
    if (query.status === 'pending') status = 'LOADING';
    else if (query.status === 'error') status = 'ERROR';
    else if (query.status === 'success') status = 'SUCCESS';

    return {
      status,
      data: query.data || [],
      error: query.error as Error | null,
    };
  }, [query.status, query.data, query.error]);

  /** 필터링 적용된 아이템 목록 */
  const filteredItems = useMemo(() => {
    if (!itemsState.data) return [];
    if (selectedCategory === 'ALL') return itemsState.data;
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
