// app/(tabs)/exchange.tsx
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import MapView from "react-native-map-clustering";
import { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SafeLayout } from "@/components/ui/safe-layout";
import { Button } from "@/components/ui/button";
import { Box, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";

import { useExchangeDashboard } from "@/src/features/exchange/hooks/useExchangeDashboard";
import { ExchangeItemRow } from "@/src/features/exchange/components/ExchangeItemRow";
import { ExchangeProfileModal } from "@/src/features/exchange/components/ExchangeProfileModal";
import { ExchangeMapOverlay } from "@/src/features/exchange/components/ExchangeMapOverlay";
import { Item } from "@/src/features/exchange/types";

/**
 * 지도 마커 리렌더링 방지용 서브 컴포넌트
 */
const MapMarkers = React.memo(({ items, currentLocation, onMarkerPress }: { 
  items: Item[], 
  currentLocation: { latitude: number; longitude: number } | null, 
  onMarkerPress: (id: number) => void 
}) => (
  <>
    {currentLocation && (
      <Marker
        coordinate={currentLocation}
        title="내 위치"
        pinColor={theme.colors.primary}
      />
    )}
    {items.map((item) => (
      item.latitude && item.longitude ? (
        <Marker
          key={`item-${item.id}`}
          coordinate={{ latitude: item.latitude, longitude: item.longitude }}
          title={item.title}
          onPress={() => onMarkerPress(item.id)}
        />
      ) : null
    ))}
  </>
));
MapMarkers.displayName = "MapMarkers";

/**
 * ExchangeScreen (Dumb View)
 *
 * Why: 교환 화면의 최상위 엔트리 포인트.
 * 비즈니스 로직은 useExchangeDashboard에 위임하고, 오직 UI 컴포넌트의 조립(Assembly)만 담당.
 */
export default function ExchangeScreen() {
  const insets = useSafeAreaInsets();
  
  // 🧠 Facade Hook 연동 (모든 두뇌는 여기로)
  const {
    mapRef,
    bottomSheetRef,
    listRef,
    itemsState,
    filteredItems,
    selectedCategory,
    refreshing,
    isMapMoved,
    currentLocation,
    defaultRegion,
    isProfileModalVisible,
    setSelectedCategory,
    setProfileModalVisible,
    setIsMapReady,
    handleRegionChangeComplete,
    moveToCurrentLocation,
    handleMarkerPress,
    handleSearchCurrentLocation,
    navigateToCreate,
    handleManualRefresh,
    router,
  } = useExchangeDashboard();

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ExchangeItemRow 
      item={item} 
      onPress={(id) => router.push(`/exchange/${id}`)} 
    />
  ), [router]);

  return (
    <SafeLayout style={styles.container}>
      {/* 1. 지도 영역 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        onMapReady={() => setIsMapReady(true)}
        onRegionChangeComplete={handleRegionChangeComplete}
        clusterColor={theme.colors.primary}
        clusterTextColor={theme.colors.background}
      >
        <MapMarkers 
          items={filteredItems}
          currentLocation={currentLocation}
          onMarkerPress={handleMarkerPress}
        />
      </MapView>

      {/* 2. 바텀시트 목록 영역 */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["15%", "85%"]}
        backgroundStyle={styles.bottomSheetBackground}
      >
        {/* 필터 헤더 */}
        <Box flexDir="row" justify="center" py="sm" gap="sm" bg="background">
          {["TICKET", "GOODS"].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "primary" : "outline"}
              size="sm"
              onPress={() => setSelectedCategory(selectedCategory === cat ? "ALL" : cat as "TICKET" | "GOODS")}
              style={styles.filterButton}
            >
              {cat === "GOODS" ? "ITEM" : cat}
            </Button>
          ))}
        </Box>

        {/* 데이터 리스트 */}
        <Box flex={1} px="SCREEN">
          {itemsState.status === "loading" && itemsState.data?.length === 0 ? (
            <Box flex={1} justify="center" align="center" py="xxl">
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </Box>
          ) : itemsState.status === "error" ? (
            <Box flex={1} justify="center" align="center" py="xxl">
              <Typography variant="caption" center mb="md">{itemsState.error}</Typography>
              <Button onPress={handleManualRefresh}>다시 시도</Button>
            </Box>
          ) : (
            <BottomSheetFlatList
              ref={listRef}
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={handleManualRefresh} 
                  tintColor={theme.colors.primary}
                />
              }
            />
          )}
        </Box>
      </BottomSheet>

      {/* 3. 오버레이 및 모달 */}
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

      <ExchangeProfileModal
        visible={isProfileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetBackground: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  filterButton: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
  },
});
