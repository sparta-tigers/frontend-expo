import { Button } from "@/components/ui/button";
import { itemsGetListAPI } from "@/src/api/items";
import { Item } from "@/src/api/types/items";
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

// 기본 색상 팔레트
const colors = {
  light: {
    primary: "#3B82F6",
    background: "#FFFFFF",
    card: "#F9FAFB",
    text: "#111827",
    border: "#E5E7EB",
    muted: "#6B7280",
    accent: "#10B981",
    destructive: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    success: "#10B981",
  },
  dark: {
    primary: "#2563EB",
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    border: "#374151",
    muted: "#9CA3AF",
    accent: "#059669",
    destructive: "#DC2626",
    warning: "#D97706",
    info: "#2563EB",
    success: "#059669",
  },
} as const;

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
    paddingVertical: 20,
    alignItems: "center",
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
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 테마 색상
  const textColor = colors.light.text;
  const primaryColor = colors.light.primary;
  const cardColor = colors.light.card;

  // 아이템 목록 가져오기
  const fetchItems = useCallback(
    async (pageNum: number = 0, isRefresh: boolean = false) => {
      if (loading && !isRefresh) return;

      setLoading(true);
      if (isRefresh) setRefreshing(true);

      try {
        const response = await itemsGetListAPI(pageNum, 10);

        if (response.resultType === "SUCCESS" && response.data) {
          const { content, last } = response.data;

          if (pageNum === 0 || isRefresh) {
            setItems(content);
          } else {
            setItems((prev) => [...prev, ...content]);
          }

          setIsLast(last);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("아이템 목록 로딩 실패:", error);
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [loading],
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
    fetchItems(0, true);
  };

  // 다음 페이지 로드
  const loadMore = () => {
    if (!loading && !isLast) {
      fetchItems(page + 1);
    }
  };

  // 아이템 렌더 함수
  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: cardColor }]}
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
        <Text style={[styles.itemTitle, { color: textColor }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.itemDescription, { color: textColor }]}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        <Text style={[styles.itemPrice, { color: primaryColor }]}>
          {item.status === "REGISTERED"
            ? "등록됨"
            : item.status === "COMPLETED"
              ? "교환완료"
              : "교환실패"}
        </Text>
        <Text style={[styles.itemDate, { color: textColor }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 화면 포커스 시 데이터 로드
  React.useEffect(() => {
    fetchItems(0);
  }, [fetchItems]);

  // 로딩 상태 표시
  if (loading && items.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.light.background }]}
      >
        <ActivityIndicator size="large" color={colors.light.primary} />
        <Text style={[styles.loadingText, { color: colors.light.text }]}>
          아이템을 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.light.background }]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.light.text }]}>
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
        data={items}
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
            <Text style={[styles.emptyText, { color: colors.light.text }]}>
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
