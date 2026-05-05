import { Href, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { itemsGetMyItemsAPI } from "@/src/features/exchange/api";
import { Item } from "@/src/features/exchange/types";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";

export default function MyItemsScreen() {
  const router = useRouter();

  const [myItems, setMyItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 내 아이템 목록 로드
  const fetchMyItems = useCallback(async () => {
    try {
      const response = await itemsGetMyItemsAPI(0, 50); // 충분히 큰 사이즈로 1페이지 호출
      if (response && response.data && response.data.content) {
        setMyItems(response.data.content);
      }
    } catch (error) {
      Logger.error("내 등록 물건 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMyItems();
  }, [fetchMyItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyItems();
    setRefreshing(false);
  }, [fetchMyItems]);

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => router.push(`/exchange/${item.id}` as Href)}
      activeOpacity={0.8}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemCategory}>
          {item.category === "TICKET" ? "티켓" : "굿즈"}
        </Text>
      </View>
      <Text style={styles.itemDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.itemFooter}>
        <Text style={styles.itemDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>활성</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 바 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내가 등록한 물건</Text>
      </View>

      {/* 목록 본문 */}
      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.mutedText}>불러오는 중...</Text>
        </View>
      ) : myItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.mutedText}>현재 활성화된 등록 물건이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={myItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.SCREEN,
    paddingVertical: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.medium,
  },
  headerTitle: {
    fontSize: theme.typography.size.SECTION_TITLE,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mutedText: {
    color: theme.colors.text.secondary,
  },
  listContainer: {
    padding: theme.spacing.SCREEN,
  },
  itemContainer: {
    padding: theme.spacing.COMPONENT,
    marginBottom: theme.spacing.SMALL,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border.medium,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.SMALL,
  },
  itemTitle: {
    fontSize: theme.typography.size.BODY,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.SMALL,
  },
  itemCategory: {
    fontSize: theme.typography.size.SMALL,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
  },
  itemDescription: {
    fontSize: theme.typography.size.SMALL,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.COMPONENT,
    minHeight: 36, // 두 줄 정렬 맞춤
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDate: {
    fontSize: theme.typography.size.CAPTION,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.SMALL,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.text.secondary, // 등록상태 (REGISTERED)
  },
  statusText: {
    fontSize: theme.typography.size.CAPTION,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.background,
  },
});
