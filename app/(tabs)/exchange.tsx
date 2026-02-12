import { Button } from "@/components/ui/button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { itemsGetListAPI } from "@/src/api/items";
import { Item } from "@/src/api/types/items";
import { useFocusEffect, useRouter } from "expo-router";
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const primaryColor = useThemeColor({}, "primary");

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
    router.push(`/exchange/${itemId.toString()}`);
  };

  // 아이템 생성 페이지로 이동
  const navigateToCreate = () => {
    router.push("/exchange/create");
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
      style={[
        styles.itemContainer,
        { backgroundColor: cardColor, borderColor },
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
      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemTitle, { color: textColor }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.itemDescription, { color: textColor }]}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        {/* 아이템 메타데이터 */}
        <View style={styles.itemMeta}>
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
      </View>
    </TouchableOpacity>
  );

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      fetchItems(0);
    }, [fetchItems]),
  );

  // 로딩 상태 표시
  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>
          아이템을 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          아이템 교환
        </Text>
        <Button
          variant="primary"
          onPress={navigateToCreate}
          style={styles.createButton}
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
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
        ListFooterComponent={() =>
          loading && items.length > 0 ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={primaryColor} />
              <Text style={[styles.footerText, { color: textColor }]}>
                더 불러오는 중...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>
              등록된 아이템이 없습니다.
            </Text>
            <Button
              variant="outline"
              onPress={navigateToCreate}
              style={styles.emptyButton}
            >
              첫 아이템 등록하기
            </Button>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  createButton: {
    minWidth: 120,
  },
  listContainer: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  itemContainer: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
  },
  itemInfo: {
    padding: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    flex: 1,
  },
  itemMeta: {
    gap: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  footerLoading: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  emptyButton: {
    minWidth: 180,
  },
});
