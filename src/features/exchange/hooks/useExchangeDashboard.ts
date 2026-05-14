// src/features/exchange/hooks/useExchangeDashboard.ts
import { useCallback, useRef, useState, useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import BottomSheet, { BottomSheetFlatListMethods } from "@gorhom/bottom-sheet";
import MapViewType from "react-native-maps";

import { useExchangeItems } from "@/src/features/exchange/hooks/useExchangeItems";
import { useExchangeMap } from "@/src/features/exchange/hooks/useExchangeMap";
import { useCheckActiveItem } from "@/src/features/exchange/queries";
import { Logger } from "@/src/utils/logger";

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

  // --- UI 상태 ---
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);

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
    defaultRegion,
    setIsMapMoved,
    handleRegionChangeComplete,
    moveToCurrentLocation,
    initializeLocation,
    setIsMapReady,
  } = useExchangeMap(isInitialFetched);

  const { data: hasActiveItem, isLoading: isCheckingActive } = useCheckActiveItem();

  // --- 초기화 로직 ---
  useEffect(() => {
    void initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    if (!isInitialFetched && userLocation) {
      void fetchInitialItems(
        userLocation.latitude,
        userLocation.longitude,
        mapRegion.latitudeDelta,
      );
    }
  }, [userLocation, isInitialFetched, mapRegion.latitudeDelta, fetchInitialItems]);

  // --- 핸들러 (명령형 흐름 제어) ---

  /** 
   * 🎯 handleMarkerPress (Zero Magic: No useEffect Chains)
   * Why: 마커 클릭 시 발생하는 UI 변화를 이벤트 핸들러 내부에서 명시적으로 제어.
   */
  const handleMarkerPress = useCallback((itemId: number) => {
    const item = filteredItems.find((i) => i.id === itemId);
    const index = filteredItems.findIndex((i) => i.id === itemId);

    if (item && item.latitude && item.longitude) {
      // 1. 지도 이동
      mapRef.current?.animateToRegion({
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }

    if (index !== -1) {
      // 2. 바텀시트 확장
      bottomSheetRef.current?.snapToIndex(1);
      
      // 3. 리스트 스크롤 (레이아웃 렌더링 대기를 위해 약간의 지연 허용)
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 300);
      
      Logger.debug("마커 연동 스크롤 완료:", { itemId, index });
    } else {
      router.push(`/exchange/${itemId}`);
    }
  }, [filteredItems, router]);

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
      Alert.alert(
        "등록 제한",
        "이미 등록된 아이템이 있습니다. 하나의 계정당 하나의 아이템만 등록 가능합니다."
      );
      return;
    }
    
    router.push("/exchange/create");
  }, [isCheckingActive, hasActiveItem, router]);

  const handleManualRefresh = useCallback(async () => {
    await handleRefresh(mapRegion.latitude, mapRegion.longitude, mapRegion.latitudeDelta);
  }, [handleRefresh, mapRegion]);

  return {
    // Refs
    mapRef,
    bottomSheetRef,
    listRef,
    
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
    setIsMapReady,
    handleRegionChangeComplete,
    moveToCurrentLocation,
    handleMarkerPress,
    handleSearchCurrentLocation,
    navigateToCreate,
    handleManualRefresh,
    
    // Router / Navigation
    router,
  };
}
