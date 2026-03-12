import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import {
  itemsGetListAPI,
} from "@/src/features/exchange/api";
import {
  Item,
} from "@/src/features/exchange/types";
import { useLocationTracker } from "@/src/hooks/useLocationTracker";
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { useLocationStore } from "@/src/store/useLocationStore";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
} from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
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
  Modal,
  Pressable,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: theme.colors.text.primary,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    width: 90,
    height: 90,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    marginRight: 14,
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
    paddingVertical: 40,
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
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  emptyButton: {
    minWidth: 120,
  },
  fabButton: {
    position: "absolute",
    bottom: theme.spacing.xxl,
    right: theme.spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  locationButton: {
    backgroundColor: theme.colors.info,
    bottom: theme.spacing.xxl + 70, // 등록 버튼 위에 위치
  },
  fabContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  fabText: {
    fontSize: 24,
    color: theme.colors.background,
  },
  // 재검색 버튼 스타일 (Phase 1)
  reSearchButton: {
    position: "absolute",
    alignSelf: "center", // left 50%, translateX 대체
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20, // 알약 모양
    flexDirection: "row",
    alignItems: "center",
    shadowColor: theme.colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000, // 최상단에 표시
  },
  reSearchText: {
    color: theme.colors.background,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    marginLeft: theme.spacing.xs,
  },
  // 1페이지: 지도 뷰 상단 오버레이 버튼들
  topOverlayContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.COMPONENT,
    zIndex: 10,
  },
  topOverlayButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.COMPONENT,
    paddingVertical: theme.spacing.SMALL,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    ...theme.shadow.card,
  },
  topOverlayButtonText: {
    fontSize: theme.typography.size.BODY,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  // 2페이지: 바텀시트 필터
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: theme.spacing.SMALL,
    gap: theme.spacing.SMALL,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.COMPONENT,
    paddingVertical: theme.spacing.TINY,
    borderRadius: 16,
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
  // Profile Modal 스타일
  // eslint-disable-next-line react-native/no-color-literals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.SCREEN,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    marginBottom: theme.spacing.COMPONENT,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: 2,
    marginBottom: theme.spacing.COMPONENT,
  },
  modalTitle: {
    fontSize: theme.typography.size.SECTION_TITLE,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  modalMenuButton: {
    paddingVertical: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalMenuButtonText: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
  },
});

/**
 * 아이템 목록 페이지 컴포넌트
 *
 * PWA의 ExchangeMainPage를 React Native로 구현
 * - 아이템 목록 표시
 * - 무한 스크롤 지원
 * - 풀다운로드 새로고침
 */
export default function ExchangeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<BottomSheetFlatListMethods>(null); // Phase 4: 리스트 스크롤 제어용

  // 위치 추적 훅 연동
  const { userLocation } = useLocationStore();
  const { errorMsg: locationError } = useLocationTracker();

  // 바텀시트 카테고리 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "TICKET" | "GOODS">("ALL");

  // 프로필 모달 상태 (8페이지 대응)
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);

  // Map-First 초기 로딩 상태 관리
  const [isInitialFetched, setIsInitialFetched] = useState(false);

  // useAsyncState 훅으로 기본 상태 관리
  const [itemsState, fetchItems] = useAsyncState<Item[]>([]);

  // 추가 상태 (페이지네이션용 - 현재 미사용)
  // const [page, setPage] = useState(0);
  // const [isLast, setIsLast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 현재 위치 상태
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 지도 이동 감지 상태 (Phase 1)
  const [isMapMoved, setIsMapMoved] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.5665, // 서울 디폴트 좌표
    longitude: 126.978,
    latitudeDelta: 0.009, // 약 1km 반경
    longitudeDelta: 0.009, // 약 1km 반경
  });
  // 아이템 목록 가져오기 (교환 완료된 아이템 필터링)
  const loadItems = useCallback(
    async (
      pageNum: number = 0,
      isRefresh: boolean = false,
      lat?: number,
      lng?: number,
      radiusKm?: number,
    ): Promise<Item[]> => {
      if (itemsState.status === "loading" && !isRefresh) return [];

      // 에러 상태에서는 재시도하지 않음 (무한반복 방지)
      if (itemsState.status === "error" && !isRefresh) return [];

      if (isRefresh) setRefreshing(true);

      try {
        const response = await itemsGetListAPI(
          pageNum,
          10,
          undefined,
          undefined,
          lat,
          lng,
          radiusKm,
        );

        if (response.resultType === "SUCCESS" && response.data) {
          const { content } = response.data;
          // 다음 페이지 정보는 현재 미사용 (BottomSheetFlatList에서 onEndReached 제거)
          // const { last } = response.data;

          // 교환 완료된 아이템 필터링 (COMPLETED/FAILED/DELETED 제외 가능)
          const filteredContent = content.filter(
            (item: Item) => item.status !== "COMPLETED",
          );

          if (pageNum === 0 || isRefresh) {
            return filteredContent;
          } else {
            // 기존 데이터에 새 데이터 추가
            return [...(itemsState.data || []), ...filteredContent];
          }
        }

        return itemsState.data || [];
      } catch (error) {
        Logger.error(
          "아이템 목록 로딩 실패:",
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      } finally {
        if (isRefresh) setRefreshing(false);
      }
    },
    [itemsState.data, itemsState.status],
  );

  // 아이템 상세 페이지로 이동
  const navigateToDetail = (itemId: number) => {
    router.push(`/exchange/${itemId}`);
  };

  // 마커 클릭 핸들러 (Phase 4)
  const handleMarkerPress = (itemId: number) => {
    // 아이템 리스트에서 해당 아이템의 인덱스 찾기
    const index = itemsState.data?.findIndex((item) => item.id === itemId);

    if (index !== undefined && index !== -1) {
      // 1. 바텀시트가 닫혀있다면 올리기
      bottomSheetRef.current?.snapToIndex(1);

      // 2. 리스트 스크롤 이동
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5, // 아이템을 화면 중앙에 위치
        });
      }, 300); // 바텀시트 애니메이션 대기

      Logger.debug("마커 연동 스크롤 완료:", { itemId, index });
    } else {
      // 아이템을 찾을 수 없으면 상세 페이지로 이동 (기존 동작)
      navigateToDetail(itemId);
    }
  };

  // 아이템 생성 페이지로 이동
  const navigateToCreate = () => {
    router.push("/exchange/create");
  };

  // 현재 위치로 이동 (Phase 3: 즉각 반응)
  const moveToCurrentLocation = () => {
    if (userLocation && mapRef.current) {
      // GPS 로딩 대기 없이 메모리 좌표로 즉시 이동!
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.009, // 약 1km 반경
          longitudeDelta: 0.009, // 약 1km 반경
        },
        500, // 0.5초 동안 부드럽게 이동
      );

      Logger.debug("[즉각 위치 이동 완료]", userLocation);
    } else {
      // 권한 거부 상태이거나 아직 첫 좌표를 못 잡은 경우의 예외 처리
      Alert.alert(
        "알림",
        locationError
          ? "위치 권한이 거부되었습니다.\n설정에서 권한을 허용해주세요."
          : "현재 위치를 확인하는 중입니다.\n잠시 후 다시 시도해주세요.",
      );
    }
  };

  // 현재 위치 가져오기 (컴포넌트 마운트 시 자동 실행)
  const getCurrentLocationOnMount = async () => {
    try {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Logger.debug("위치 권한이 거부됨");
        return;
      }

      // 현재 위치 가져오기
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const userLocation = { latitude, longitude };

      setCurrentLocation(userLocation);

      // 지도를 현재 위치로 이동 (1km 반경)
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...userLocation,
            latitudeDelta: 0.009, // 약 1km 반경
            longitudeDelta: 0.009, // 약 1km 반경
          },
          1000,
        );
      }

      Logger.debug("[초기 위치 설정]", userLocation);
    } catch (error) {
      Logger.error(
        "초기 위치 가져오기 실패:",
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshing(true);
    // 🚨 지도 좌표 연동
    const radius = mapRegion.latitudeDelta * 111; // 1도 ≈ 111km
    fetchItems(
      loadItems(0, true, mapRegion.latitude, mapRegion.longitude, radius),
    );
    setRefreshing(false);
  };

  // 지도 이동 완료 핸들러 (Phase 1)
  const handleRegionChangeComplete = (region: any) => {
    setMapRegion(region);
    // 지도가 완전히 로딩된 이후의 유저 드래그만 이동으로 간주
    if (isMapReady) {
      setIsMapMoved(true);
    }
  };

  // 현 지도에서 재검색 핸들러 (Phase 2)
  const handleSearchCurrentLocation = async () => {
    try {
      // 재검색 버튼 즉시 숨김
      setIsMapMoved(false);

      // 현재 지도 중심 좌표로 아이템 목록 새로고침
      setRefreshing(true);

      if (true) {
        // 지도 중심 좌표와 반경 계산하여 API 호출
        const radius = mapRegion.latitudeDelta * 111; // 대략적인 반경 계산 (1도 ≈ 111km)
        await fetchItems(
          loadItems(0, true, mapRegion.latitude, mapRegion.longitude, radius),
        );
      }

      setRefreshing(false);

      Logger.debug("현 지도에서 재검색 완료", {
        center: mapRegion,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      Logger.error("현 지도에서 재검색 실패:", error);
      setRefreshing(false);
      // 에러 발생 시 버튼 다시 표시
      setIsMapMoved(true);
    }
  };

  // 다음 페이지 로드 (현재 미사용 - BottomSheetFlatList에서 onEndReached 제거)
  // const loadMore = () => {
  //   // 에러 상태에서는 자동 로드를 차단하여 무한 루프 방지
  //   if (
  //     itemsState.status !== "loading" &&
  //     itemsState.status !== "error" &&
  //     !isLast
  //   ) {
  //     const nextPage = page + 1;
  //     setPage(nextPage);
  //     fetchItems(loadItems(nextPage, false));
  //   }
  // };

  // 아이템 렌더 함수
  const renderItem = ({ item }: { item: Item }) => (
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
      {/* 아이템 이미지 */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.emptyImageContainer]}>
          <Text style={styles.emptyText}>이미지 없음</Text>
        </View>
      )}

      {/* 아이템 정보 */}
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
  );

  // 1. 컴포넌트 마운트 시 최초 1회만 실행 (위치 조회)
  React.useEffect(() => {
    getCurrentLocationOnMount();
  }, []); // 의존성 배열을 비워 마운트 시 1회만 실행 보장

  // 필터링 적용된 목록 도출
  const filteredItemsData = React.useMemo(() => {
    if (!itemsState.data) return [];
    if (selectedCategory === "ALL") return itemsState.data;
    return itemsState.data.filter(item => item.category === selectedCategory);
  }, [itemsState.data, selectedCategory]);

  // 2. Map-First 초기 데이터 로딩 (GPS 좌표가 잡히는 즉시 실행)
  React.useEffect(() => {
    let isMounted = true;

    const fetchInitialMapData = async () => {
      // 마운트 해제됨, 이미 로딩됨, 혹은 GPS 아직 못 잡음 ➔ 대기
      if (!isMounted || isInitialFetched || !userLocation) return;

      // GPS 좌표가 들어왔다! ➔ 지도 기반 반경 계산 후 즉시 아이템 페칭
      const radius = mapRegion.latitudeDelta * 111;
      await fetchItems(
        loadItems(
          0,
          true,
          userLocation.latitude,
          userLocation.longitude,
          radius,
        ),
      );

      // 최초 1회 로딩 완료 플래그 세팅 (이후에는 '현 지도에서 재검색' 버튼으로만 수동 갱신)
      setIsInitialFetched(true);
      Logger.debug(" [Map-First] 초기 GPS 기반 아이템 로딩 완료", userLocation);
    };

    fetchInitialMapData();

    return () => {
      isMounted = false;
    };
  }, [
    userLocation,
    isInitialFetched,
    mapRegion.latitudeDelta,
    fetchItems,
    loadItems,
  ]);

  return (
    <SafeLayout style={styles.container}>
      {/* 1. 백그라운드 지도 뷰 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.5665, // 서울 디폴트 좌표
          longitude: 126.978,
          latitudeDelta: 0.009, // 약 1km 반경
          longitudeDelta: 0.009, // 약 1km 반경
        }}
        showsUserLocation={false}
        onMapReady={() => setIsMapReady(true)} // 지도 로딩 완료 플래그
        onRegionChangeComplete={handleRegionChangeComplete} // Phase 1: 지도 이동 감지
      >
        {/* 현재 위치 마커 */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="내 위치"
            description="현재 내 위치"
            pinColor="blue"
          />
        )}

        {/* 아이템 마커 */}
        {itemsState.data?.map((item: Item) => {
          // Phase 3: 강화된 방어 로직 - 유효한 좌표만 마커 렌더링
          if (
            typeof item.latitude !== "number" ||
            typeof item.longitude !== "number" ||
            isNaN(item.latitude) ||
            isNaN(item.longitude) ||
            item.latitude === 0 ||
            item.longitude === 0
          ) {
            Logger.debug("무효한 좌표의 아이템 마커 제외:", {
              itemId: item.id,
              title: item.title,
              latitude: item.latitude,
              longitude: item.longitude,
              latType: typeof item.latitude,
              lngType: typeof item.longitude,
            });
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
              onPress={() => handleMarkerPress(item.id)}
              // TODO: 커스텀 아이콘으로 마커 디자인 개선 가능
            />
          );
        })}
      </MapView>

      {/* 1. 바텀시트 아래에 깔릴 우하단 플로팅 버튼 (위치 및 프로필) */}
      <View style={styles.fabContainer}>
        {/* 현재 위치 버튼 */}
        <TouchableOpacity
          style={[styles.fabButton, styles.locationButton]}
          onPress={moveToCurrentLocation}
        >
          <Text style={styles.fabText}>📍</Text>
        </TouchableOpacity>

        {/* 8페이지 진입: 내 정보 모달 오픈 */}
        <TouchableOpacity style={styles.fabButton} onPress={() => setProfileModalVisible(true)}>
          <Text style={styles.fabText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* 2. 스와이프업 리스트 뷰 (바텀시트) - React Native 특성상 나중에 렌더링되어야 플로팅 요소들을 위로 덮음 */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["15%", "85%"]}
        style={styles.bottomSheetContainer}
      >
        {/* 2페이지 디자인: TICKET / ITEM 필터 */}
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
          {/* 아이템 목록 */}
          {itemsState.status === "loading" && itemsState.data?.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  아이템 목록 로딩 중...
                </Text>
              </View>
            ) : itemsState.status === "error" && 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {itemsState.error || "아이템 목록을 불러올 수 없습니다."}
                </Text>
                <Button
                  onPress={() => {
                    const radius = mapRegion.latitudeDelta * 111; // 1도 ≈ 111km
                    fetchItems(
                      loadItems(
                        0,
                        true,
                        mapRegion.latitude,
                        mapRegion.longitude,
                        radius,
                      ),
                    );
                  }}
                  style={styles.emptyButton}
                >
                  다시 시도
                </Button>
              </View>
            ) : (
                <BottomSheetFlatList
                ref={listRef} // 리스트 스크롤 제어용 ref 연결
                data={filteredItemsData}
                renderItem={renderItem}
                keyExtractor={(item: Item) => item.id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            )}
        </View>
      </BottomSheet>

      {/* 3. 지도 상단 플로팅 오버레이 버튼들 (항상 바텀시트보다 위에 있어야 하므로 더 나중에 렌더링) */}
      <View style={styles.topOverlayContainer}>
        <TouchableOpacity style={styles.topOverlayButton} onPress={navigateToCreate}>
          <Text style={styles.topOverlayButtonText}>+ 등록하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topOverlayButton} onPress={() => router.push("/exchange/requests")}>
          <Text style={styles.topOverlayButtonText}>💬 교환현황</Text>
        </TouchableOpacity>
      </View>

      {/* 4. 현 지도에서 재검색 버튼 (Phase 1) - 최상단 고정 */}
      {isMapMoved && (
        <TouchableOpacity
          style={[
            styles.reSearchButton,
            { top: Math.max(insets.top, 20) + 70 }, // topOverlay 버튼 영역 아래로 동적 할당
          ]}
          onPress={handleSearchCurrentLocation}
        >
          <Text style={styles.reSearchText}>↻ 현 지도에서 재검색</Text>
        </TouchableOpacity>
      )}

      {/* Profile Modal (8-11페이지 연결) */}
      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setProfileModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>내 활동 관리</Text>
            </View>

            <TouchableOpacity
              style={styles.modalMenuButton}
              onPress={() => {
                setProfileModalVisible(false);
                router.push("/exchange/my-items");
              }}
            >
              <Text style={styles.modalMenuButtonText}>내가 등록한 물건</Text>
              <Text style={[{ color: colors.muted }]}>{">"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalMenuButton}
              onPress={() => {
                setProfileModalVisible(false);
                router.push("/exchange/history");
              }}
            >
              <Text style={styles.modalMenuButtonText}>종료된 교환 내역</Text>
              <Text style={[{ color: colors.muted }]}>{">"}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeLayout>
  );
}
