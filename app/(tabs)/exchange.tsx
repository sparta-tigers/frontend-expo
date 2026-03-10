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
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { theme } from "@/src/styles/theme";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: theme.colors.primary,
  },
  inactiveTab: {
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  tabText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
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
  } as any,
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
    fontSize: theme.typography.size.BODY,
    textAlign: "center",
    marginBottom: theme.spacing.COMPONENT,
  },
  emptyButton: {
    minWidth: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: theme.typography.size.BODY,
    marginTop: theme.spacing.SMALL,
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

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<"items" | "requests">("items");

  // useAsyncState 훅으로 기본 상태 관리
  const [itemsState, fetchItems] = useAsyncState<Item[]>([]);
  const [requestsState, fetchRequests] = useAsyncState<ExchangeRequest[]>([]);

  // 추가 상태 (페이지네이션용)
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 받은 교환 요청 목록 가져오기
  const loadExchangeRequests = useCallback(
    async (pageNum: number = 0, isRefresh: boolean = false) => {
      if (requestsState.status === "loading" && !isRefresh) return;

      try {
        const response = await exchangeGetReceivedAPI(pageNum, 10);

        if (response.resultType === "SUCCESS" && response.data) {
          const newRequests = response.data.content || [];

          if (isRefresh || pageNum === 0) {
            await fetchRequests(Promise.resolve(newRequests));
          } else {
            const currentRequests = requestsState.data || [];
            await fetchRequests(
              Promise.resolve([...currentRequests, ...newRequests]),
            );
          }

          setIsLast(response.data.last || false);
        }
      } catch (error) {
        console.error("교환 요청 목록 로딩 실패:", error);
        Alert.alert("오류", "교환 요청 목록을 불러올 수 없습니다.");
      }
    },
    [requestsState.status, fetchRequests, requestsState.data],
  );

  // 아이템 목록 가져오기 (교환 완료된 아이템 필터링)
  const loadItems = useCallback(
    async (
      pageNum: number = 0,
      isRefresh: boolean = false,
    ): Promise<Item[]> => {
      if (itemsState.status === "loading" && !isRefresh) return [];

      // 에러 상태에서는 재시도하지 않음 (무한반복 방지)
      if (itemsState.status === "error" && !isRefresh) return [];

      if (isRefresh) setRefreshing(true);

      try {
        const response = await itemsGetListAPI(pageNum, 10);

        if (response.resultType === "SUCCESS" && response.data) {
          const { content, last } = response.data;
          setIsLast(last); // 다음 페이지 호출 차단 스위치

          // 교환 완료된 아이템 필터링
          const filteredContent = content.filter(
            (item: Item) => item.status !== "EXCHANGE_COMPLETED",
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
        console.error("아이템 목록 로딩 실패:", error);
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
        console.error("교환 요청 상태 변경 실패:", error);
        Alert.alert("오류", "네트워크 에러가 발생했습니다.");
      }
    },
    [loadExchangeRequests],
  );

  // 아이템 상세 페이지로 이동
  const navigateToDetail = (itemId: number) => {
    router.push(`/exchange/${itemId}` as any);
  };

  // 아이템 생성 페이지로 이동
  const navigateToCreate = () => {
    router.push("/exchange/create" as any);
  };

  // 새로고침 핸들러
  const onRefresh = () => {
    setPage(0);
    setIsLast(false);
    fetchItems(loadItems(0, true));
  };

  // 다음 페이지 로드
  const loadMore = () => {
    // 에러 상태에서는 자동 로드를 차단하여 무한 루프 방지
    if (
      itemsState.status !== "loading" &&
      itemsState.status !== "error" &&
      !isLast
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(loadItems(nextPage, false));
    }
  };

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
        <View
          style={[
            styles.itemImage,
            {
              backgroundColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text
            style={{ color: colors.muted, fontSize: theme.typography.size.xs }}
          >
            이미지 없음
          </Text>
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

      if (activeTab === "items") {
        fetchItems(loadItems(0, true));
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
    <SafeLayout style={{ backgroundColor: colors.background }}>
      {/* 헤더 */}
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
            activeTab === "items" && {
              borderBottomWidth: 2,
              borderBottomColor: colors.primary,
            },
          ]}
          onPress={() => setActiveTab("items")}
        >
          <Text
            style={[
              {
                fontSize: 16,
                fontWeight: "bold",
                color: activeTab === "items" ? colors.primary : colors.muted,
              },
            ]}
          >
            아이템 목록
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "requests" && {
              borderBottomWidth: 2,
              borderBottomColor: colors.primary,
            },
          ]}
          onPress={() => setActiveTab("requests")}
        >
          <Text
            style={[
              {
                fontSize: 16,
                fontWeight: "bold",
                color: activeTab === "requests" ? colors.primary : colors.muted,
              },
            ]}
          >
            받은 요청
          </Text>
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 영역 */}
      <View style={styles.listContainer}>
        {activeTab === "items" ? (
          // 아이템 목록
          <>
            {itemsState.status === "loading" && page === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  아이템 목록 로딩 중...
                </Text>
              </View>
            ) : itemsState.status === "error" && page === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {itemsState.error || "아이템 목록을 불러올 수 없습니다."}
                </Text>
                <Button
                  onPress={() => fetchItems(loadItems(0, true))}
                  style={styles.emptyButton}
                >
                  다시 시도
                </Button>
              </View>
            ) : (
              <FlatList
                data={itemsState.data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                key="items-flatlist" // numColumns 변경 시 강제 리렌더링을 위한 키 추가
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      등록된 아이템이 없습니다.
                    </Text>
                    <Button
                      onPress={navigateToCreate}
                      style={styles.emptyButton}
                    >
                      첫 아이템 등록
                    </Button>
                  </View>
                }
                ListFooterComponent={
                  itemsState.status === "loading" && page > 0 ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text
                        style={[styles.loadingText, { color: colors.text }]}
                      >
                        더 불러오는 중...
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </>
        ) : (
          // 교환 요청 목록
          <>
            {requestsState.status === "loading" && page === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  요청 목록 로딩 중...
                </Text>
              </View>
            ) : requestsState.status === "error" && page === 0 ? (
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
              <FlatList
                data={requestsState.data}
                renderItem={renderExchangeRequest}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadExchangeRequests(0, true)}
                  />
                }
              />
            )}
          </>
        )}
      </View>

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity
        style={{
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
        }}
        onPress={navigateToCreate}
      >
        <Text
          style={{
            color: theme.colors.background,
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
          }}
        >
          +
        </Text>
      </TouchableOpacity>
    </SafeLayout>
  );
}
