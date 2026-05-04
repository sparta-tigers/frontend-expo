
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { exchangeGetMyRequestsAPI } from "@/src/features/exchange/api";
import { ReceiveExchangeRequest } from "@/src/features/exchange/types";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

export default function ExchangeHistoryScreen() {
  const { colors } = useTheme();

  const insets = useSafeAreaInsets();

  const [historyItems, setHistoryItems] = useState<ReceiveExchangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 내역 로드 (COMPLETED, FAILED, REJECTED 상태 필터링)
  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      // 백엔드 API가 history 전용이 없으므로, 모든 제안("all" 혹은 sent/received) 중 종료된 것을 가져온다고 가정합니다.
      // 본 구현에서는 받은 제안 기준으로 예시 작성 (실제로는 API 확장이 필요할 수 있음)
      const resSent = await exchangeGetMyRequestsAPI("sender", 0, 50);
      const resReceived = await exchangeGetMyRequestsAPI("receiver", 0, 50);

      const allRequests = [
        ...(resSent?.data?.content || []),
        ...(resReceived?.data?.content || []),
      ];

      const finalized = allRequests.filter((req) =>
        ["COMPLETED", "FAILED", "REJECTED"].includes(req.status)
      );

      // 중복 제거 (exchangeRequestId 기준)
      const uniqueFinalized = Array.from(
        new Map(finalized.map((item) => [item.exchangeRequestId, item])).values()
      );

      // 최신순 정렬
      uniqueFinalized.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setHistoryItems(uniqueFinalized);
    } catch (error) {
      Logger.error("교환 내역 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ReceiveExchangeRequest }) => {
    const isCompleted = item.status === "COMPLETED";

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        // ReceiveExchangeRequest에는 roomId가 없으므로 상세 이동은 비활성화
        activeOpacity={0.8}
        disabled
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title || "삭제된 교환 게시글"}  
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted ? colors.primary : colors.destructive,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.background }]}>
              {isCompleted ? "교환 성공" : "교환 실패"}
            </Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <Text style={[styles.itemDate, { color: colors.muted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={[styles.roomIdLabel, { color: colors.muted }]}>
            {item.sender.userNickname}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 20) }]}>
      {/* 헤더 바 */}
      <View style={[styles.header, styles.headerCenter, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>종료된 교환 내역</Text>
      </View>

      {/* 목록 본문 */}
      {isLoading ? (
        <View style={styles.centered}>
          <Text style={[{ color: colors.muted }]}>불러오는 중...</Text>
        </View>
      ) : historyItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[{ color: colors.muted }]}>종료된 교환 내역이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={historyItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.exchangeRequestId.toString()}
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
  headerTitle: {
    fontSize: FONT_SIZE.SECTION_TITLE,
    fontWeight: "bold",
  },
  headerCenter: {
    justifyContent: "center",
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
  statusBadge: {
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  statusText: {
    fontSize: FONT_SIZE.CAPTION,
    fontWeight: "bold", // 600 대신 bold (React Native font weight 기준)
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.COMPONENT,
  },
  itemDate: {
    fontSize: FONT_SIZE.CAPTION,
  },
  roomIdLabel: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
  },
});
