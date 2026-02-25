import { Button } from "@/components/ui/button";
import { itemsGetListAPI } from "@/src/api/items";
import { Item } from "@/src/api/types/items";
import { useAsyncState } from "@/src/hooks/useAsyncState";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerButton: {
    minWidth: 100,
  },
  listContainer: {
    padding: 8,
  },
  itemContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemDate: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
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
    fontSize: 16,
    marginTop: 8,
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
  const theme = useTheme();

  // useAsyncState 훅으로 기본 상태 관리
  const [itemsState, fetchItems] = useAsyncState<Item[]>([]);

  // 추가 상태 (페이지네이션용)
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 아이템 목록 가져오기
  const loadItems = useCallback(
    async (pageNum: number = 0, isRefresh: boolean = false) => {
      if (itemsState.status === "loading" && !isRefresh) return;

      // 에러 상태에서는 재시도하지 않음 (무한반복 방지)
      if (itemsState.status === "error" && !isRefresh) return;

      if (isRefresh) setRefreshing(true);

      try {
        const response = await itemsGetListAPI(pageNum, 10);

        if (response.resultType === "SUCCESS" && response.data) {
          const { content, last } = response.data;
          setIsLast(last); // 다음 페이지 호출 차단 스위치

          if (pageNum === 0 || isRefresh) {
            return content;
          } else {
            // 기존 데이터에 새 데이터 추가
            return [...(itemsState.data || []), ...content];
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

  // 아이템 상세 페이지로 이동
  const navigateToDetail = (itemId: number) => {
    router.push(`/exchange/[id]?id=${itemId}` as any);
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

  // 아이템 렌더 함수
  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        {
          backgroundColor: theme.colors.surfaceVariant,
          shadowColor: theme.colors.shadow,
        },
      ]}
      onPress={() => navigateToDetail(item.id)}
      activeOpacity={0.7}
    >
      {/* 아이템 이미지 */}
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}

      {/* 아이템 정보 */}
      <View style={styles.itemContent}>
        <Text
          style={[styles.itemTitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.itemDescription,
            { color: theme.colors.onSurfaceVariant },
          ]}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
          {item.status === "REGISTERED"
            ? "등록됨"
            : item.status === "COMPLETED"
              ? "교환완료"
              : "교환실패"}
        </Text>
        <Text
          style={[styles.itemDate, { color: theme.colors.onSurfaceVariant }]}
        >
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 화면 포커스 시 데이터 로드 (최초 1번만 실행)
  React.useEffect(() => {
    // 에러 상태가 아닐 때만 로드 시도
    if (itemsState.status === "idle") {
      fetchItems(loadItems(0));
    }
  }, []); // 빈 의존성 배열로 최초 1번만 실행

  // 에러 상태 표시 (무한 루프 방지)
  if (
    itemsState.status === "error" &&
    (!itemsState.data || itemsState.data.length === 0)
  ) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.emptyText, { color: theme.colors.error }]}>
          {itemsState.error || "데이터를 불러오는데 실패했습니다."}
        </Text>
        <Button
          onPress={() => fetchItems(loadItems(0, true))}
          style={styles.emptyButton}
        >
          다시 시도
        </Button>
      </View>
    );
  }

  // 로딩 상태 표시
  if (
    itemsState.status === "loading" &&
    (!itemsState.data || itemsState.data.length === 0)
  ) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          아이템을 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* 헤더 */}
      <View
        style={[styles.header, { borderBottomColor: theme.colors.outline }]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          아이템 교환
        </Text>
        <Button
          variant="primary"
          size="sm"
          onPress={navigateToCreate}
          style={styles.headerButton}
        >
          아이템 등록
        </Button>
      </View>

      {/* 아이템 목록 */}
      <FlatList
        data={itemsState.data || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              등록된 아이템이 없습니다.
            </Text>
            <Button
              variant="outline"
              onPress={navigateToCreate}
              style={styles.emptyButton}
            >
              아이템 등록
            </Button>
          </View>
        )}
      />
    </View>
  );
}
