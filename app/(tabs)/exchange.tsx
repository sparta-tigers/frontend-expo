import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import {
  exchangeGetReceivedAPI,
  exchangeUpdateStatusAPI,
  itemsGetListAPI,
} from "@/src/features/exchange/api";
import {
  ExchangeRequest,
  ExchangeRequestStatus,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: theme.spacing.xxl,
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
  },
  tabContainer: {
    flexDirection: "row",
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
  activeTabIndicator: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.text.primary,
  },
  tabTextActive: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text.primary,
  },
  tabTextInactive: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text.secondary,
  },
  // 교환 요청 관련 스타일
  requestContainer: {
    borderRadius: theme.radius.CARD,
    padding: theme.spacing.COMPONENT,
    marginBottom: theme.spacing.SMALL,
    ...theme.shadow.card,
  },
  requestContent: {
    flex: 1,
  },
  requestTitle: {
    fontSize: theme.typography.size.BODY,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.SMALL,
  },
  requester: {
    fontSize: theme.typography.size.SMALL,
    marginBottom: theme.spacing.SMALL,
  },
  requestDate: {
    fontSize: theme.typography.size.CAPTION,
    marginBottom: theme.spacing.SMALL,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.SMALL,
    paddingVertical: theme.spacing.SMALL,
    borderRadius: theme.radius.sm,
    alignSelf: "flex-start",
    marginBottom: theme.spacing.SMALL,
  },
  statusText: {
    fontSize: theme.typography.size.SMALL,
    fontWeight: theme.typography.weight.semibold,
  },
  requestActions: {
    flexDirection: "row",
    gap: theme.spacing.SMALL,
    marginTop: theme.spacing.SMALL,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: theme.typography.size.SMALL,
    fontWeight: theme.typography.weight.semibold,
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

  // Phase 3: 위치 추적 훅 연동
  const { userLocation } = useLocationStore();
  const { errorMsg: locationError } = useLocationTracker();

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<"items" | "requests">("items");

  // useAsyncState 훅으로 기본 상태 관리
  const [itemsState, fetchItems] = useAsyncState<Item[]>([]);
  const [requestsState, fetchRequests] = useAsyncState<ExchangeRequest[]>([]);

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

  // 받은 교환 요청 목록 가져오기
  const loadExchangeRequests = useCallback(
    async (pageNum: number = 0, isRefresh: boolean = false) => {
      if (requestsState.status === "loading" && !isRefresh) return;

      try {
        const response = await exchangeGetReceivedAPI(pageNum, 10);

        const requests =
          response.resultType === "SUCCESS" && response.data
            ? response.data.content
            : [];

        if (pageNum === 0 || isRefresh) {
          await fetchRequests(Promise.resolve(requests));
        } else {
          await fetchRequests(
            Promise.resolve([...(requestsState.data || []), ...requests]),
          );
        }

        // setIsLast(responseData?.last || false);
      } catch (error) {
        Logger.error("교환 요청 목록 로딩 실패:", error);
        Alert.alert("오류", "교환 요청 목록을 불러올 수 없습니다.");
        await fetchRequests(Promise.resolve([]));
      }
    },
    [requestsState.status, fetchRequests, requestsState.data],
  );

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

  // 교환 요청 상태 변경 (수락/거절)
  const handleUpdateRequestStatus = useCallback(
    async (requestId: number, status: ExchangeRequestStatus) => {
      try {
        const response = await exchangeUpdateStatusAPI(requestId, { status });

        if (response.resultType === "SUCCESS") {
          Alert.alert(
            "성공",
            status === ExchangeRequestStatus.ACCEPTED
              ? "교환 요청을 수락했습니다."
              : "교환 요청을 거절했습니다.",
            [
              {
                text: "확인",
                onPress: () => loadExchangeRequests(0, true), // 목록 새로고침
              },
            ],
          );
        } else {
          Alert.alert("오류", "상태 변경에 실패했습니다.");
        }
      } catch (error) {
        Logger.error(
          "교환 요청 상태 변경 실패:",
          error instanceof Error ? error.message : String(error),
        );
        Alert.alert("오류", "네트워크 에러가 발생했습니다.");
      }
    },
    [loadExchangeRequests],
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
    if (activeTab === "items") {
      // 🚨 수정된 부분: 새로고침 시에도 반드시 지도 중심 좌표와 반경을 전달!
      const radius = mapRegion.latitudeDelta * 111; // 1도 ≈ 111km
      fetchItems(
        loadItems(0, true, mapRegion.latitude, mapRegion.longitude, radius),
      );
    } else {
      loadExchangeRequests(0, true);
    }
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

      if (activeTab === "items") {
        // 지도 중심 좌표와 반경 계산하여 API 호출
        const radius = mapRegion.latitudeDelta * 111; // 대략적인 반경 계산 (1도 ≈ 111km)
        await fetchItems(
          loadItems(0, true, mapRegion.latitude, mapRegion.longitude, radius),
        );
      } else {
        await loadExchangeRequests(0, true);
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

  // 교환 요청 렌더 함수
  const renderExchangeRequest = ({ item }: { item: ExchangeRequest }) => (
    <View
      style={[
        styles.requestContainer,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.border,
        },
      ]}
    >
      {/* 요청 정보 */}
      <View style={styles.requestContent}>
        <Text style={[styles.requestTitle, { color: colors.text }]}>
          {item.item?.title || "아이템 정보 없음"}
        </Text>
        <Text style={[styles.requester, { color: colors.muted }]}>
          요청자: {item.requester?.nickname || "알 수 없음"}
        </Text>
        <Text style={[styles.requestDate, { color: colors.muted }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        {/* 상태 배지 */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === ExchangeRequestStatus.PENDING
                  ? colors.warning + "20"
                  : item.status === ExchangeRequestStatus.ACCEPTED
                    ? colors.success + "20"
                    : colors.destructive + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === ExchangeRequestStatus.PENDING
                    ? colors.warning
                    : item.status === ExchangeRequestStatus.ACCEPTED
                      ? colors.success
                      : colors.destructive,
              },
            ]}
          >
            {item.status === ExchangeRequestStatus.PENDING
              ? "대기 중"
              : item.status === ExchangeRequestStatus.ACCEPTED
                ? "수락됨"
                : "거절됨"}
          </Text>
        </View>
      </View>

      {/* 액션 버튼 */}
      {item.status === ExchangeRequestStatus.PENDING && (
        <View style={styles.requestActions}>
          <Button
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() =>
              handleUpdateRequestStatus(item.id, ExchangeRequestStatus.ACCEPTED)
            }
          >
            <Text
              style={[styles.actionButtonText, { color: colors.background }]}
            >
              수락
            </Text>
          </Button>
          <Button
            style={[
              styles.actionButton,
              { backgroundColor: colors.destructive },
            ]}
            variant="outline"
            onPress={() =>
              handleUpdateRequestStatus(item.id, ExchangeRequestStatus.REJECTED)
            }
          >
            <Text
              style={[styles.actionButtonText, { color: colors.destructive }]}
            >
              거절
            </Text>
          </Button>
        </View>
      )}
    </View>
  );

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

  // 초기 데이터 로드 - 무한 리렌더링 방지
  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      // 컴포넌트 마운트 시 현재 위치 가져오기
      getCurrentLocationOnMount();

      if (activeTab === "items") {
        // 🚨 수정된 부분: 초기 로딩 시에도 반드시 지도 중심 좌표와 반경을 전달!
        const radius = mapRegion.latitudeDelta * 111; // 1도 ≈ 111km
        fetchItems(
          loadItems(0, true, mapRegion.latitude, mapRegion.longitude, radius),
        );
      } else {
        loadExchangeRequests(0, true);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // activeTab만 의존성으로 설정

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

      {/* 2. 스와이프업 리스트 뷰 (바텀시트) */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["15%", "85%"]}
        style={styles.bottomSheetContainer}
      >
        {/* 바텀시트 헤더 */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>교환</Text>
          <Button onPress={navigateToCreate} size="sm">
            + 등록
          </Button>
        </View>

        {/* 탭 전환 */}
        <View
          style={[
            styles.tabContainer,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "items" && styles.activeTabIndicator,
            ]}
            onPress={() => setActiveTab("items")}
          >
            <Text
              style={[
                activeTab === "items"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              아이템 목록
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "requests" && styles.activeTabIndicator,
            ]}
            onPress={() => setActiveTab("requests")}
          >
            <Text
              style={[
                activeTab === "requests"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              받은 요청
            </Text>
          </TouchableOpacity>
        </View>

        {/* 콘텐츠 영역 */}
        <View style={styles.listContainer}>
          {/* 아이템 목록 */}
          {activeTab === "items" &&
            (itemsState.status === "loading" && 0 ? (
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
                    // 🚨 수정된 부분: 다시 시도 버튼에서도 좌표 전달!
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
                ref={listRef} // Phase 4: 리스트 스크롤 제어용 ref 연결
                data={itemsState.data}
                renderItem={renderItem}
                keyExtractor={(item: Item) => item.id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            ))}

          {/* 교환 요청 목록 */}
          {activeTab === "requests" &&
            (requestsState.status === "loading" && 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  요청 목록 로딩 중...
                </Text>
              </View>
            ) : requestsState.status === "error" && 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {requestsState.error || "요청 목록을 불러올 수 없습니다."}
                </Text>
                <Button
                  onPress={() => loadExchangeRequests(0, true)}
                  style={styles.emptyButton}
                >
                  다시 시도
                </Button>
              </View>
            ) : (
              <BottomSheetFlatList
                data={requestsState.data}
                renderItem={renderExchangeRequest}
                keyExtractor={(item: ExchangeRequest) => item.id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            ))}
        </View>
      </BottomSheet>

      {/* 3. 플로팅 버튼 그룹 (바텀시트 위에 떠있어야 함) */}
      <View style={styles.fabContainer}>
        {/* 현 지도에서 재검색 버튼 (Phase 1) */}
        {isMapMoved && (
          <TouchableOpacity
            style={[
              styles.reSearchButton,
              { top: insets.top + 16 }, // 🚨 Safe Area를 고려하여 동적 여백 할당
            ]}
            onPress={handleSearchCurrentLocation}
          >
            <Text style={styles.reSearchText}>↻ 현 지도에서 재검색</Text>
          </TouchableOpacity>
        )}

        {/* 현재 위치 버튼 */}
        <TouchableOpacity
          style={[styles.fabButton, styles.locationButton]}
          onPress={moveToCurrentLocation}
        >
          <Text style={styles.fabText}>📍</Text>
        </TouchableOpacity>

        {/* 등록 버튼 */}
        <TouchableOpacity style={styles.fabButton} onPress={navigateToCreate}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeLayout>
  );
}
