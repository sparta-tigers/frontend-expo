import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { itemsGetMyItemsAPI } from "@/src/features/exchange/api";
import { Item } from "@/src/features/exchange/types";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

export default function MyItemsScreen() {
  const { colors } = useTheme();
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyItems();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => router.push(`/exchange/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.itemCategory, { color: colors.primary }]}>
          {item.category === "TICKET" ? "티켓" : "굿즈"}
        </Text>
      </View>
      <Text style={[styles.itemDescription, { color: colors.muted }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.itemFooter}>
        <Text style={[styles.itemDate, { color: colors.muted }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: colors.muted, // 등록상태 (REGISTERED)
            },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.background }]}>활성</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 바 */}
      <View style={[styles.header, styles.headerCenter, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>내가 등록한 물건</Text>
      </View>

      {/* 목록 본문 */}
      {isLoading ? (
        <View style={styles.centered}>
          <Text style={[{ color: colors.muted }]}>불러오는 중...</Text>
        </View>
      ) : myItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[{ color: colors.muted }]}>현재 활성화된 등록 물건이 없습니다.</Text>
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
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.SCREEN,
    paddingVertical: SPACING.COMPONENT,
    borderBottomWidth: 1,
  },
  headerCenter: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZE.SECTION_TITLE,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    padding: SPACING.SCREEN,
  },
  itemContainer: {
    padding: SPACING.COMPONENT,
    marginBottom: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.CARD,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SMALL,
  },
  itemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
    flex: 1,
    marginRight: SPACING.SMALL,
  },
  itemCategory: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "bold",
  },
  itemDescription: {
    fontSize: FONT_SIZE.SMALL,
    marginBottom: SPACING.COMPONENT,
    minHeight: 36, // 두 줄 정렬 맞춤
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDate: {
    fontSize: FONT_SIZE.CAPTION,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  statusText: {
    fontSize: FONT_SIZE.CAPTION,
    fontWeight: "600",
  },
});
