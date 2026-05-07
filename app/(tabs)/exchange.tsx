import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useCheckActiveItem } from "@/src/features/exchange/queries";
import { Item } from "@/src/features/exchange/types";
import { useExchangeItems } from "@/src/features/exchange/hooks/useExchangeItems";
import { useExchangeMap } from "@/src/features/exchange/hooks/useExchangeMap";
import { ExchangeProfileModal } from "@/src/features/exchange/components/ExchangeProfileModal";
import { ExchangeMapOverlay } from "@/src/features/exchange/components/ExchangeMapOverlay";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import { getImageUrl } from "@/src/utils/url";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import MapView from "react-native-map-clustering";
import { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Typography } from "@/components/ui";
import { Image } from "expo-image";

/** 교환 화면 전용 레이아웃 상수 (theme에 올리지 않는 화면 로컬 수치) */
const EXCHANGE_LAYOUT = {
  itemImageSize: 90,
  emptyPaddingVertical: 40,
  emptyButtonMinWidth: 120,
} as const;

/**
 * 지도 마커 렌더링 최적화 컴포넌트
 * 바텀시트 상태 변경 등과 독립적으로 마커 리렌더링 방지
 */
const MapMarkers = React.memo(({ items, currentLocation, onMarkerPress }: { 
  items: Item[] | null | undefined, 
  currentLocation: { latitude: number; longitude: number } | null, 
  onMarkerPress: (id: number) => void 
}) => {
  return (
    <>
      {currentLocation && (
        <Marker
          coordinate={currentLocation}
          title="내 위치"
          description="현재 내 위치"
          pinColor={theme.colors.primary}
        />
      )}
      {items?.map((item: Item) => {
        if (
          typeof item.latitude !== "number" ||
          typeof item.longitude !== "number" ||
          isNaN(item.latitude) ||
          isNaN(item.longitude) ||
          item.latitude === 0 ||
          item.longitude === 0
        ) {
          return null;
        }

        return (
          <Marker
            key={`item-${item.id}`}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title={item.title}
            description={item.category === "TICKET" ? "티켓" : "굿즈"}
            onPress={() => onMarkerPress(item.id)}
          />
        );
      })}
    </>
  );
});

MapMarkers.displayName = "MapMarkers";

/**
 * 교환 화면 오케스트레이터
 *
 * 책임: 훅들과 하위 컴포넌트를 조합하여 화면을 구성.
 * 비즈니스 로직은 useExchangeMap, useExchangeItems 훅이 담당.
 * UI 조각은 ExchangeProfileModal, ExchangeMapOverlay가 담당.
 */
export default function ExchangeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<BottomSheetFlatListMethods>(null);

  // 프로필 모달 상태
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);

  // --- 커스텀 훅 연동 ---
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
    mapRef,
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

  // 활성 아이템 체크 쿼리 (Navigation Guard용)
  const { data: hasActiveItem, isLoading: isCheckingActive } = useCheckActiveItem();

  // --- 네비게이션 핸들러 ---
  const navigateToDetail = useCallback((itemId: number) => {
    router.push(`/exchange/${itemId}`);
  }, [router]);

  const navigateToCreate = useCallback(() => {
    if (isCheckingActive) return;

    if (hasActiveItem === true) {
      Alert.alert(
        "등록 제한",
        "이미 등록된 아이템이 있습니다. 하나의 계정당 하나의 아이템만 등록 가능합니다.\n\n기존 아이템을 삭제하거나 교환 완료 후 새 아이템을 등록해주세요."
      );
      return;
    }
    
    router.push("/exchange/create");
  }, [isCheckingActive, hasActiveItem, router]);

  // --- 마커 클릭 → 바텀시트 스크롤 연동 ---
  const handleMarkerPress = useCallback((itemId: number) => {
    const item = filteredItems.find((i) => i.id === itemId);
    const index = filteredItems.findIndex((i) => i.id === itemId);

    if (item && item.latitude && item.longitude) {
      // 🚨 앙드레 카파시: 명령형 지도 제어 (Zoom-in)
      // Why: 마커 클릭 시 해당 위치로 집중시켜 사용자 UX를 강화.
      mapRef.current?.animateToRegion({
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }

    if (index !== undefined && index !== -1) {
      bottomSheetRef.current?.snapToIndex(1);
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 300);
      Logger.debug("마커 연동 스크롤 완료:", { itemId, index });
    } else {
      navigateToDetail(itemId);
    }
  }, [filteredItems, navigateToDetail, mapRef]);

  // --- 지도 재검색 핸들러 ---
  const handleSearchCurrentLocation = useCallback(async () => {
    setIsMapMoved(false);
    try {
      await searchByRegion(mapRegion.latitude, mapRegion.longitude, mapRegion.latitudeDelta);
    } catch {
      setIsMapMoved(true);
    }
  }, [mapRegion, searchByRegion, setIsMapMoved]);

  // --- Effects (최소화: 마운트 + 초기 데이터 로딩) ---

  // 1. 마운트 시 위치 초기화 (1회)
  React.useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // 2. GPS 좌표 확보 시 초기 아이템 로딩 (1회)
  React.useEffect(() => {
    if (!isInitialFetched && userLocation) {
      fetchInitialItems(
        userLocation.latitude,
        userLocation.longitude,
        mapRegion.latitudeDelta,
      );
    }
  }, [userLocation, isInitialFetched, mapRegion.latitudeDelta, fetchInitialItems]);

  // --- 아이템 렌더 함수 ---
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.itemContainer}
      onPress={() => navigateToDetail(item.id)}
    >
      <Box mr="md">
        {item.imageUrl ? (
          <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.itemImage} />
        ) : (
          <Box 
            width={EXCHANGE_LAYOUT.itemImageSize} 
            height={EXCHANGE_LAYOUT.itemImageSize} 
            bg="border.medium" 
            rounded="md" 
            align="center" 
            justify="center"
          >
            <Typography variant="caption" color="text.tertiary">이미지 없음</Typography>
          </Box>
        )}
      </Box>

      <Box flex={1} justify="space-between">
        <Box>
          <Typography
            variant="body2"
            weight="bold"
            color="text.primary"
            numberOfLines={1}
          >
            {item.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            numberOfLines={2}
            mt="xs"
          >
            {item.description}
          </Typography>
        </Box>
        <Box flexDir="row" justify="space-between" align="center">
          <Typography variant="caption" color="primary" weight="semibold">
            {item.category === "TICKET" ? "티켓" : "굿즈"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(item.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
    </TouchableOpacity>
  ), [navigateToDetail]);

  // --- 렌더링 ---
  return (
    <SafeLayout style={styles.container}>
      {/* 1. 백그라운드 지도 뷰 (Clustered) */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={false}
        onMapReady={() => setIsMapReady(true)}
        onRegionChangeComplete={handleRegionChangeComplete}
        // Clustering Options
        clusterColor={theme.colors.primary}
        clusterTextColor={theme.colors.background}
        animationEnabled={true}
      >
        <MapMarkers 
          items={filteredItems}
          currentLocation={currentLocation}
          onMarkerPress={handleMarkerPress}
        />
      </MapView>

      {/* 2. 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["15%", "85%"]}
        style={styles.bottomSheetContainer}
        backgroundStyle={styles.bottomSheetBackground}
      >
        {/* 카테고리 필터 */}
        <Box flexDir="row" justify="center" py="sm" gap="sm" bg="background">
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.filterButton, selectedCategory === "TICKET" && styles.filterButtonActive]}
            onPress={() => setSelectedCategory(selectedCategory === "TICKET" ? "ALL" : "TICKET")}
          >
            <Typography 
              variant="caption" 
              color={selectedCategory === "TICKET" ? "background" : "text.secondary"}
              weight={selectedCategory === "TICKET" ? "bold" : "regular"}
            >
              TICKET
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.filterButton, selectedCategory === "GOODS" && styles.filterButtonActive]}
            onPress={() => setSelectedCategory(selectedCategory === "GOODS" ? "ALL" : "GOODS")}
          >
            <Typography 
              variant="caption" 
              color={selectedCategory === "GOODS" ? "background" : "text.secondary"}
              weight={selectedCategory === "GOODS" ? "bold" : "regular"}
            >
              ITEM
            </Typography>
          </TouchableOpacity>
        </Box>

        {/* 콘텐츠 영역 */}
        <Box flex={1} px="SCREEN">
          {itemsState.status === "loading" && itemsState.data?.length === 0 ? (
              <Box flex={1} justify="center" align="center" py="xxl">
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Typography variant="body2" color="text.primary" mt="sm">
                  아이템 목록 로딩 중...
                </Typography>
              </Box>
            ) : itemsState.status === "error" ? (
              <Box flex={1} justify="center" align="center" py="xxl">
                <Typography variant="caption" color="text.primary" center mb="md">
                  {itemsState.error || "아이템 목록을 불러올 수 없습니다."}
                </Typography>
                <Button
                  onPress={() => {
                    // 🚨 앙드레 카파시: 초기 로딩 실패 시 결정론적 재시도 경로
                    if (userLocation) {
                      fetchInitialItems(
                        userLocation.latitude,
                        userLocation.longitude,
                        mapRegion.latitudeDelta
                      );
                    } else {
                      handleRefresh(mapRegion.latitude, mapRegion.longitude, mapRegion.latitudeDelta);
                    }
                  }}
                  style={styles.emptyButton}
                >
                  다시 시도
                </Button>
              </Box>
            ) : (
                <BottomSheetFlatList
                ref={listRef}
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item: Item) => item.id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => handleRefresh(mapRegion.latitude, mapRegion.longitude, mapRegion.latitudeDelta)}
                  />
                }
              />
            )}
        </Box>
      </BottomSheet>

      {/* 3. 지도 오버레이 (FAB + 상단 버튼 + 재검색) */}
      <ExchangeMapOverlay
        topInset={insets.top}
        isProfileModalVisible={isProfileModalVisible}
        isMapMoved={isMapMoved}
        onMoveToLocation={moveToCurrentLocation}
        onOpenProfile={() => setProfileModalVisible(true)}
        onNavigateToCreate={navigateToCreate}
        onNavigateToRequests={() => router.push("/exchange/requests")}
        onSearchCurrentLocation={handleSearchCurrentLocation}
      />

      {/* 4. 프로필 모달 */}
      <ExchangeProfileModal
        visible={isProfileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </SafeLayout>
  );
}

// ========================================================
// Styles — Co-location 유지, 하드코딩 제거
// ========================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: theme.spacing.xs,
    elevation: 5,
  },
  bottomSheetBackground: {
    backgroundColor: theme.colors.background,
  },
  itemContainer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.surface,
  },
  itemImage: {
    width: EXCHANGE_LAYOUT.itemImageSize,
    height: EXCHANGE_LAYOUT.itemImageSize,
    borderRadius: theme.radius.md,
  },
  emptyButton: {
    minWidth: EXCHANGE_LAYOUT.emptyButtonMinWidth,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.COMPONENT,
    paddingVertical: theme.spacing.TINY,
    borderRadius: theme.radius.lg + 4,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.text.secondary,
    borderColor: theme.colors.text.secondary,
  },
});
