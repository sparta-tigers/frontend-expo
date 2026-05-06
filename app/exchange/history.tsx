import { theme } from "@/src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeLayout } from "@/components/ui/safe-layout";
import { exchangeGetMyRequestsAPI } from "@/src/features/exchange/api";
import { ReceiveExchangeRequest, ExchangeRequestStatus } from "@/src/features/exchange/types";
import { Logger } from "@/src/utils/logger";

/**
 * 교환 완료 내역 화면
 * 사용자가 완료(승낙/거절)한 모든 교환 요청 내역을 표시합니다.
 */
export default function ExchangeHistoryScreen() {
  const router = useRouter();

  const [history, setHistory] = useState<ReceiveExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 데이터 로드 함수
  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 받은 요청 중에서 대기 중(PENDING)이 아닌 것들을 내역으로 간주
      const response = await exchangeGetMyRequestsAPI("receiver", 0, 50);
      if (response.resultType === "SUCCESS" && response.data) {
        const completedItems = response.data.content.filter(
          item => item.exchangeStatus !== ExchangeRequestStatus.PENDING
        );
        setHistory(completedItems);
      }
    } catch (error) {
      Logger.error("교환 내역 로드 실패:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 화면 진입 시마다 데이터 페칭
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const renderHistoryItem = useCallback(({ item }: { item: ReceiveExchangeRequest }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            item.exchangeStatus === ExchangeRequestStatus.ACCEPTED && styles.statusAccepted,
            item.exchangeStatus === ExchangeRequestStatus.REJECTED && styles.statusRejected,
          ]}>
            <Text style={styles.statusText}>
              {item.exchangeStatus === ExchangeRequestStatus.ACCEPTED ? "승낙" : 
               item.exchangeStatus === ExchangeRequestStatus.REJECTED ? "거절" : "완료"}
            </Text>
          </View>
        </View>
        <Text style={styles.itemDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemCategory}>
        카테고리: {item.category === "TICKET" ? "티켓" : "굿즈"}
      </Text>

      <View style={styles.itemFooter}>
        <Text style={styles.partnerText}>상대방: {item.sender.userNickname}</Text>
      </View>
    </View>
  ), []);

  if (loading && !refreshing) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.safeLayout}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>교환 내역</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.exchangeRequestId.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHistory(true)}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>교환 내역이 없습니다.</Text>
            </View>
          }
        />
      </View>
    </SafeLayout>
  );
}

// --- Styles — Co-location & Static Analysis Optimized ---
const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    color: theme.colors.text.primary,
  },
  headerRightSpacer: {
    width: 40,
  },
  backButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  historyItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    ...theme.shadow.card,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.text.tertiary,
  },
  statusAccepted: {
    backgroundColor: theme.colors.success,
  },
  statusRejected: {
    backgroundColor: theme.colors.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.card,
  },
  itemDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.medium,
  },
  partnerText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
