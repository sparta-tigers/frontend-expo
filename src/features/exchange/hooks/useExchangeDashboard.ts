// src/features/exchange/hooks/useExchangeDashboard.ts
import BottomSheet, { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import MapViewType from 'react-native-maps';
import { useToastStore } from '@/src/store/useToastStore';

import { useExchangeItems } from '@/src/features/exchange/hooks/useExchangeItems';
import { useExchangeMap } from '@/src/features/exchange/hooks/useExchangeMap';
import { useCheckActiveItem } from '@/src/features/exchange/queries';
import { Logger } from '@/src/utils/logger';

/**
 * useExchangeDashboard
 *
 * Why: 교환 화면의 모든 비즈니스 로직과 명령형 UI 제어를 담당하는 파사드 훅.
 * 뷰에서 Ref 관리와 복잡한 연쇄 액션을 은닉하여 'Zero Magic'을 실현함.
 */
export function useExchangeDashboard() {
  const router = useRouter();

  // --- Refs (명령형 제어용) ---
  const mapRef = useRef<MapViewType>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<BottomSheetFlatListMethods>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- UI 상태 ---
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const profileModalRef = useRef<BottomSheetModal>(null);

  // --- 기존 훅 연동 ---
  const {
    itemsState,
    selectedCategory,
    setSelectedCategory,
    filteredItems,
    refreshing,
    isInitialFetched,
    handleRefresh,
    searchByRegion,
    fetchInitialItems,
  } = useExchangeItems();

  const {
    mapRegion,
    isMapMoved,
    currentLocation,
    userLocation,
    locationError,
    defaultRegion,
    setIsMapMoved,
    handleRegionChangeComplete,
    moveToCurrentLocation,
    setIsMapReady,
  } = useExchangeMap(isInitialFetched);

  const { data: hasActiveItem, isLoading: isCheckingActive } = useCheckActiveItem();

  // --- 초기화 로직 ---
  useEffect(() => {
    if (locationError) {
      showToast('현재 위치를 확인하지 못해 기본 위치로 보여드릴게요.', undefined, 'info');
    }
  }, [locationError, showToast]);

  useEffect(() => {
    if (!isInitialFetched && userLocation) {
      fetchInitialItems(
        userLocation.latitude,
        userLocation.longitude,
        mapRegion.latitudeDelta,
      ).catch(() => {
        // fetchInitialItems 내부에서 로깅 수행됨
        showToast('주변 아이템 목록을 불러오지 못했어요.', undefined, 'error');
      });
    }
  }, [userLocation, isInitialFetched, mapRegion.latitudeDelta, fetchInitialItems, showToast]);

  // --- 핸들러 (명령형 흐름 제어) ---

  /**
   * 🎯 handleMarkerPress (Zero Magic: No useEffect Chains)
   * Why: 마커 클릭 시 발생하는 UI 변화를 이벤트 핸들러 내부에서 명시적으로 제어.
   */

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleMarkerPress = useCallback(
    (itemId: number) => {
      const index = filteredItems.findIndex((i) => i.id === itemId);
      const item = index !== -1 ? filteredItems[index] : undefined;

      if (item && item.latitude != null && item.longitude != null) {
        // 1. 지도 이동
        mapRef.current?.animateToRegion(
          {
            latitude: item.latitude,
            longitude: item.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          500,
        );
      }

      if (index !== -1) {
        // 2. 바텀시트 확장
        bottomSheetRef.current?.snapToIndex(1);

        // 3. 리스트 스크롤 (레이아웃 렌더링 대기를 위해 약간의 지연 허용)
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          listRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 300);

        Logger.debug('마커 연동 스크롤 완료:', { itemId, index });
      } else {
        router.push(`/exchange/${itemId}`);
      }
    },
    [filteredItems, router],
  );

  const handleSearchCurrentLocation = useCallback(async () => {
    setIsMapMoved(false);
    try {
      await searchByRegion(mapRegion.latitude, mapRegion.longitude, mapRegion.latitudeDelta);
    } catch {
      setIsMapMoved(true);
    }
  }, [mapRegion, searchByRegion, setIsMapMoved]);

  const navigateToCreate = useCallback(() => {
    if (isCheckingActive) return;

    if (hasActiveItem === true) {
      showToast('이미 등록한 물건이 있어요. 계정당 하나만 등록할 수 있어요.', undefined, 'info');
      return;
    }

    router.push('/exchange/create');
  }, [isCheckingActive, hasActiveItem, router, showToast]);

  const handleManualRefresh = useCallback(async () => {
    try {
      await handleRefresh(mapRegion.latitude, mapRegion.longitude, mapRegion.latitudeDelta);
    } catch {
      showToast('네트워크 상태를 확인하고 다시 시도해주세요.', undefined, 'error');
    }
  }, [handleRefresh, mapRegion, showToast]);

  const navigateToItemDetail = useCallback(
    (itemId: number) => {
      router.push(`/exchange/${itemId}`);
    },
    [router],
  );

  const navigateToRequests = useCallback(() => {
    router.push('/exchange/requests');
  }, [router]);

  const handleOpenProfileModal = useCallback(() => {
    setProfileModalVisible(true);
    profileModalRef.current?.present();
  }, []);

  return {
    // Refs
    mapRef,
    bottomSheetRef,
    listRef,
    profileModalRef,

    // State
    itemsState,
    filteredItems,
    selectedCategory,
    refreshing,
    mapRegion,
    isMapMoved,
    currentLocation,
    defaultRegion,
    isProfileModalVisible,

    // Setters / Actions
    setSelectedCategory,
    setProfileModalVisible,
    handleOpenProfileModal,
    setIsMapReady,
    handleRegionChangeComplete,
    moveToCurrentLocation,
    handleMarkerPress,
    handleSearchCurrentLocation,
    navigateToCreate,
    handleManualRefresh,
    navigateToItemDetail,
    navigateToRequests,
  };
}
