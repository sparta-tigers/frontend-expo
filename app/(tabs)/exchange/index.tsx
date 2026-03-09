import { useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import { itemsGetListAPI } from "@/src/features/exchange/api";
import { Item } from "@/src/features/exchange/types";

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.COMPONENT,
    paddingHorizontal: SPACING.SCREEN,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.SCREEN,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.COMPONENT,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    padding: SPACING.COMPONENT,
    marginHorizontal: SPACING.SCREEN,
    marginBottom: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.CARD,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.IMAGE,
    marginRight: SPACING.COMPONENT,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.SMALL / 2,
  },
  itemDescription: {
    fontSize: FONT_SIZE.SMALL,
    marginBottom: SPACING.SMALL / 2,
  },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCategory: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
  },
  itemDate: {
    fontSize: FONT_SIZE.CAPTION,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    marginBottom: SPACING.COMPONENT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
    marginTop: SPACING.SMALL,
  },
  fab: {
    position: "absolute",
    bottom: SPACING.SCREEN,
    right: SPACING.SCREEN,
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

/**
 * 교환 메인 리스트 페이지 컴포넌트
 *
 * 작업 지시서 Phase 1 Target 1 구현
 * - FlashList 적용 (메모리 최적화)
 * - React Query 무한 스크롤
 * - 필터 탭 (전체/내 구단)
 * - 플로팅 액션 버튼
 */
export default function ExchangeListScreen() {
  const { colors } = useTheme();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();

  // 필터 상태 (Zustand 등으로 관리 가능)
  const [activeTab, setActiveTab] = React.useState<"all" | "myTeam">("all");

  // React Query 무한 스크롤 훅
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["items", { categoryId: categoryId || "all", tab: activeTab }],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await itemsGetListAPI(pageParam, 20);

      if (response.resultType === "SUCCESS" && response.data) {
        // 교환 완료된 아이템 필터링
        const filteredContent = response.data.content.filter(
          (item: Item) => item.status !== "EXCHANGE_COMPLETED",
        );

        return {
          items: filteredContent,
          nextPage: response.data.last ? undefined : pageParam + 1,
        };
      }

      throw new Error("아이템 목록을 불러올 수 없습니다.");
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 0, // 항상 최신 상태 유지
    initialPageParam: 0,
  });

  // 플랫 데이터 변환
  const flattenedData = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  // 아이템 렌더 함수
  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <Card
        style={[
          styles.itemContainer,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.border,
          },
        ]}
        onPress={() => router.push(`/exchange/${item.id}` as any)}
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
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              이미지 없음
            </Text>
          </View>
        )}

        {/* 아이템 정보 */}
        <View style={styles.itemContent}>
          <Text
            style={[styles.itemTitle, { color: colors.text }]}
            numberOfLines={2}
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
      </Card>
    ),
    [colors],
  );

  // Skeleton UI 컴포넌트
  const renderSkeletonItem = useCallback(
    () => (
      <View
        style={[
          styles.itemContainer,
          {
            backgroundColor: colors.surface,
            opacity: 0.6,
          },
        ]}
      >
        <View style={[styles.itemImage, { backgroundColor: colors.border }]} />
        <View style={styles.itemContent}>
          <View
            style={[
              styles.itemTitle,
              {
                backgroundColor: colors.border,
                height: 20,
                width: "80%",
                borderRadius: 4,
              },
            ]}
          />
          <View
            style={[
              styles.itemDescription,
              {
                backgroundColor: colors.border,
                height: 16,
                width: "100%",
                borderRadius: 4,
                marginTop: 4,
              },
            ]}
          />
          <View
            style={[
              styles.itemDescription,
              {
                backgroundColor: colors.border,
                height: 16,
                width: "60%",
                borderRadius: 4,
                marginTop: 4,
              },
            ]}
          />
        </View>
      </View>
    ),
    [colors],
  );

  // 로딩 상태 컴포넌트
  if (isLoading && !data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
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
          <Button size="sm" disabled>
            + 등록
          </Button>
        </View>

        <View
          style={[
            styles.tabContainer,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          {["전체", "내 구단"].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === (index === 0 ? "all" : "myTeam") && [
                  styles.activeTab,
                  { borderBottomColor: colors.primary },
                ],
              ]}
              onPress={() => setActiveTab(index === 0 ? "all" : "myTeam")}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === (index === 0 ? "all" : "myTeam")
                        ? colors.primary
                        : colors.muted,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={[1, 2, 3, 4, 5]} // Skeleton 아이템 5개
            renderItem={renderSkeletonItem}
            keyExtractor={(_, index) => `skeleton-${index}`}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={{ height: SPACING.SMALL }} />
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태 컴포넌트
  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            아이템 목록을 불러올 수 없습니다.
          </Text>
          <Button onPress={() => refetch()}>다시 시도</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
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
        <Button
          size="sm"
          onPress={() => router.push("/exchange/create" as any)}
        >
          + 등록
        </Button>
      </View>

      {/* 필터 탭 */}
      <View
        style={[
          styles.tabContainer,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {["전체", "내 구단"].map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === (index === 0 ? "all" : "myTeam") && [
                styles.activeTab,
                { borderBottomColor: colors.primary },
              ],
            ]}
            onPress={() => setActiveTab(index === 0 ? "all" : "myTeam")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === (index === 0 ? "all" : "myTeam")
                      ? colors.primary
                      : colors.muted,
                },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FlatList (FlashList 대체 - 임시) */}
      <View style={styles.listContainer}>
        <FlatList
          data={flattenedData}
          renderItem={renderItem}
          numColumns={2}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                등록된 아이템이 없습니다.
              </Text>
              <Button onPress={() => router.push("/exchange/create" as any)}>
                첫 아이템 등록
              </Button>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  더 불러오는 중...
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingHorizontal: SPACING.SCREEN }}
        />
      </View>

      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
          },
        ]}
        onPress={() => router.push("/exchange/create" as any)}
      >
        <Text style={[styles.fabText, { color: colors.background }]}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
