import { theme } from "@/src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useExchangeRequests } from "@/src/features/exchange/hooks/useExchangeRequests";
import { ReceiveExchangeRequest, ExchangeRequestStatus } from "@/src/features/exchange/types";

/**
 * 교환 요청 관리 화면
 * 받은 요청과 보낸 요청을 탭으로 구분하여 관리합니다.
 */
export default function ExchangeRequestsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"receiver" | "sender">("receiver");

  const {
    requests,
    loading,
    refreshing,
    error,
    handleRefresh,
    handleAccept,
    handleReject,
    fetchRequests
  } = useExchangeRequests(activeTab);


  const onAccept = useCallback(async (id: number) => {
    Alert.alert("교환 승낙", "이 교환 요청을 승낙하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "승낙", onPress: async () => {
          try {
            await handleAccept(id);
            Alert.alert("성공", "교환 요청을 승낙했습니다.");
          } catch {
            Alert.alert("실패", "수락 처리 중 오류가 발생했습니다.");
          }
        } 
      },
    ]);
  }, [handleAccept]);

  const onReject = useCallback(async (id: number) => {
    Alert.alert("교환 거절", "이 교환 요청을 거절하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "거절", onPress: async () => {
          try {
            await handleReject(id);
            Alert.alert("성공", "교환 요청을 거절했습니다.");
          } catch {
            Alert.alert("실패", "거절 처리 중 오류가 발생했습니다.");
          }
        }, 
        style: "destructive" 
      },
    ]);
  }, [handleReject]);

  const renderRequestItem = useCallback(({ item }: { item: ReceiveExchangeRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={[
          styles.statusText,
          item.exchangeStatus === ExchangeRequestStatus.ACCEPTED && styles.statusAccepted,
          item.exchangeStatus === ExchangeRequestStatus.REJECTED && styles.statusRejected
        ]}>
          {item.exchangeStatus === ExchangeRequestStatus.PENDING ? "대기 중" :
           item.exchangeStatus === ExchangeRequestStatus.ACCEPTED ? "승낙됨" : 
           item.exchangeStatus === ExchangeRequestStatus.REJECTED ? "거절됨" : "완료됨"}
        </Text>
      </View>

      <View style={styles.requestInfo}>
        <Text style={styles.requesterText}>상대방: {item.sender.userNickname}</Text>
        <Text style={styles.categoryText}>카테고리: {item.category === "TICKET" ? "티켓" : "굿즈"}</Text>
        <Text style={styles.dateText}>요청일: {new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      {item.exchangeStatus === ExchangeRequestStatus.PENDING && activeTab === "receiver" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAccept(item.exchangeRequestId)}
          >
            <Text style={styles.buttonText}>승낙</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => onReject(item.exchangeRequestId)}
          >
            <Text style={styles.buttonText}>거절</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [activeTab, onAccept, onReject]);

  if (loading && !refreshing && requests.length === 0) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>로딩 중...</Text>
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
            style={styles.tabArrowButton}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>교환 요청</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "receiver" && styles.activeTab]}
            onPress={() => setActiveTab("receiver")}
          >
            <Text style={[styles.tabText, activeTab === "receiver" && styles.activeTabText]}>
              받은 요청
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "sender" && styles.activeTab]}
            onPress={() => setActiveTab("sender")}
          >
            <Text style={[styles.tabText, activeTab === "sender" && styles.activeTabText]}>
              보낸 요청
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.exchangeRequestId.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {error ? `에러: ${error}` : (activeTab === "receiver"
                  ? "받은 교환 요청이 없습니다."
                  : "보낸 교환 요청이 없습니다.")}
              </Text>
              {(requests.length === 0 || error) && !loading && (
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchRequests()}>
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
              )}
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
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24, // theme.ts에 24 토큰 없음, 디자인 정합성 위해 유지하거나 추가 필요
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    color: theme.colors.text.primary,
  },
  headerRightSpacer: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.card,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  requestItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    ...theme.shadow.card,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  itemTitle: {
    fontSize: theme.typography.size.CARD_TITLE,
    fontWeight: "700",
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusText: {
    fontSize: theme.typography.size.sm,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  statusAccepted: {
    color: theme.colors.success,
  },
  statusRejected: {
    color: theme.colors.error,
  },
  requestInfo: {
    marginBottom: theme.spacing.lg,
  },
  requesterText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  acceptButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  rejectButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    fontSize: theme.typography.size.sm,
    fontWeight: "700",
    color: theme.colors.card,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.size.md,
    textAlign: "center",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  retryButtonText: {
    color: theme.colors.card,
    fontSize: theme.typography.size.md,
    fontWeight: "600",
  },
  tabArrowButton: {
    padding: theme.spacing.sm,
  },
});
