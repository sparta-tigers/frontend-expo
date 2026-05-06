import { theme } from "@/src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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

  // 화면 진입 시마다 데이터 페칭
  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

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
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
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
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 12,
  },
  requestItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    ...theme.shadow.card,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  requesterText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  rejectButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    fontSize: 14,
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
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: "600",
  },
  tabArrowButton: {
    padding: 8,
  },
});
