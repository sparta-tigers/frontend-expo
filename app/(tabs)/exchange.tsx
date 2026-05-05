import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
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
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
          pinColor="blue"
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
  const { colors } = useTheme();
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
    const index = itemsState.data?.findIndex((item) => item.id === itemId);

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
  }, [itemsState.data, navigateToDetail]);

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
      style={[
        styles.itemContainer,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.border,
        },
      ]}
      onPress={() => navigateToDetail(item.id)}
    >
      {item.imageUrl ? (
        <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.emptyImageContainer]}>
          <Text style={styles.emptyText}>이미지 없음</Text>
        </View>
      )}

      <View style={styles.itemContent}>
        <Text
          style={[styles.itemTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.itemDescription, { color: colors.muted }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemCategory, { color: colors.primary }]}>
            {item.category === "TICKET" ? "티켓" : "굿즈"}
          </Text>
          <Text style={[styles.itemDate, { color: colors.muted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [colors, navigateToDetail]);

  // --- 렌더링 ---
  return (
    <SafeLayout style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. 백그라운드 지도 뷰 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={false}
        onMapReady={() => setIsMapReady(true)}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        <MapMarkers 
          items={itemsState.data}
          currentLocation={currentLocation}
          onMarkerPress={handleMarkerPress}
        />
      </MapView>

      {/* 2. 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["15%", "85%"]}
        style={styles.bottomSheetContainer}
        backgroundStyle={{ backgroundColor: colors.background }}
      >
        {/* 카테고리 필터 */}
        <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedCategory === "TICKET" && styles.filterButtonActive]}
            onPress={() => setSelectedCategory(selectedCategory === "TICKET" ? "ALL" : "TICKET")}
          >
            <Text style={[styles.filterButtonText, selectedCategory === "TICKET" && styles.filterButtonTextActive]}>TICKET</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedCategory === "GOODS" && styles.filterButtonActive]}
            onPress={() => setSelectedCategory(selectedCategory === "GOODS" ? "ALL" : "GOODS")}
          >
            <Text style={[styles.filterButtonText, selectedCategory === "GOODS" && styles.filterButtonTextActive]}>ITEM</Text>
          </TouchableOpacity>
        </View>

        {/* 콘텐츠 영역 */}
        <View style={styles.listContainer}>
          {itemsState.status === "loading" && itemsState.data?.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  아이템 목록 로딩 중...
                </Text>
              </View>
            ) : itemsState.status === "error" ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {itemsState.error || "아이템 목록을 불러올 수 없습니다."}
                </Text>
                <Button
                  onPress={() => {
                    handleRefresh(mapRegion.latitude, mapRegion.longitude, mapRegion.latitudeDelta);
                  }}
                  style={styles.emptyButton}
                >
                  다시 시도
                </Button>
              </View>
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
        </View>
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
  listContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.SCREEN,
  },
  itemContainer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },
  itemImage: {
    width: EXCHANGE_LAYOUT.itemImageSize,
    height: EXCHANGE_LAYOUT.itemImageSize,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.md,
  },
  itemContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.bold,
  },
  itemDescription: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCategory: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weight.semibold,
  },
  itemDate: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: EXCHANGE_LAYOUT.emptyPaddingVertical,
  },
  emptyText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.COMPONENT,
  },
  emptyImageContainer: {
    backgroundColor: theme.colors.border.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: EXCHANGE_LAYOUT.emptyPaddingVertical,
  },
  loadingText: {
    fontSize: theme.typography.size.md,
    marginTop: theme.spacing.sm,
  },
  emptyButton: {
    minWidth: EXCHANGE_LAYOUT.emptyButtonMinWidth,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: theme.spacing.SMALL,
    gap: theme.spacing.SMALL,
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
  filterButtonText: {
    fontSize: theme.typography.size.SMALL,
    color: theme.colors.text.secondary,
  },
  filterButtonTextActive: {
    color: theme.colors.background,
    fontWeight: theme.typography.weight.bold,
  },
});
