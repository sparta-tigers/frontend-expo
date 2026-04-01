import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import {
    exchangeGetMyRequestsAPI,
    exchangeUpdateStatusAPI,
} from "@/src/features/exchange/api";
import {
    ExchangeRequestStatus,
    ReceiveExchangeRequest,
    UpdateExchangeStatusDto,
} from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";
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

/**
 * 아이템 상태 텍스트 변환 (ItemStatus 기반)
 * 콴포넌트 밖으로 분리 — 리렌더마다 재생성 방지
 */
const getItemStatusText = (status: string): string => {
  switch (status) {
    case "REGISTERED":
      return "대기 중";
    case "COMPLETED":
      return "거래 완료";
    case "FAILED":
      return "거래 취소";
    case "DELETED":
      return "삭제됨";
    default:
      return '알 수 없음';
  }
};

/**
 * 받은 교환 요청 목록 화면
 * 유저가 받은 교환 요청을 수락/거절할 수 있는 화면
 */
export default function ExchangeRequestsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"receiver" | "sender">("receiver");
  /** [RC-2] 수락/거절 처리 중인 requestId — null이면 처리 중 아님 */
  const [processingId, setProcessingId] = useState<number | null>(null);

  // [P2-1] useAsyncState 에서 reset 함수 추가 — 탭 전환 시 이전 상태 안전하게 시각적 제거
  const [requestsState, loadRequests, resetRequests] = useAsyncState<ReceiveExchangeRequest[]>([]);

  // [P1-1] ReceiveExchangeRequest 기반 데이터 페치 함수
  const fetchExchangeRequests = useCallback(async (tab: "receiver" | "sender") => {
    if (!user?.accessToken) throw new Error("로그인이 필요합니다.");

    const response = await exchangeGetMyRequestsAPI(tab, 0, 20);

    if (response.resultType === "SUCCESS" && response.data) {
      return response.data.content || [];
    }

    throw new Error(
      typeof response.error === "string"
        ? response.error
        : "교환 요청 목록을 불러올 수 없습니다.",
    );
  }, [user?.accessToken]);

  // [ML-1] useFocusEffect — 탭 복귀 시에도 목록 자동 갱신
  // 기존 useEffect(처음 로드)를 useFocusEffect 하나로 통합
  useFocusEffect(
    useCallback(() => {
      resetRequests();
      loadRequests(fetchExchangeRequests(activeTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, user?.accessToken]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests(fetchExchangeRequests(activeTab)).finally(() => setRefreshing(false));
  }, [activeTab, fetchExchangeRequests, loadRequests]);

  // [RC-2] 교환 요청 수락 — processingId guard로 광클 방어
  const handleAcceptRequest = useCallback(
    async (requestId: number) => {
      // 이미 다른 요청 처리 중이면 무시
      if (processingId !== null) return;

      Alert.alert(
        "교환 요청 수락",
        "이 교환 요청을 수락하시겠습니까? 수락하면 1:1 채팅으로 이동합니다.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "수락",
            style: "default",
            onPress: async () => {
              // Alert 확인 시점에 처리 잠금
              setProcessingId(requestId);
              try {
                const updateData: UpdateExchangeStatusDto = {
                  status: ExchangeRequestStatus.ACCEPTED,
                  message: "교환 요청을 수락했습니다.",
                };

                const response = await exchangeUpdateStatusAPI(requestId, updateData);

                if (response.resultType === "SUCCESS") {
                  const roomId =
                    response.data?.directRoomId ?? response.data?.roomId;

                  // 수락 성공 후 목록 갱신
                  resetRequests();
                  loadRequests(fetchExchangeRequests(activeTab));

                  if (!roomId) {
                    Alert.alert(
                      "수락 완료",
                      "교환 요청을 수락했습니다. 채팅방이 생성되면 교환현황에서 확인하세요.",
                    );
                    return;
                  }

                  Alert.alert(
                    "수락 완료",
                    "교환 요청을 수락했습니다. 채팅으로 이동합니다.",
                    [{ text: "확인", onPress: () => router.push(`/exchange/chat/${roomId}`) }],
                  );
                } else {
                  Alert.alert("오류", "교환 요청 수락에 실패했습니다.");
                }
              } catch (error) {
                Logger.error("교환 요청 수락 실패:", error);
                Alert.alert("오류", "네트워크 에러가 발생했습니다.");
              } finally {
                // 처리 완료 후 잠금 해제
                setProcessingId(null);
              }
            },
          },
        ],
      );
    },
    [router, loadRequests, resetRequests, fetchExchangeRequests, activeTab, processingId],
  );

  // [RC-2] 교환 요청 거절 — processingId guard로 광클 방어
  const handleRejectRequest = useCallback(
    async (requestId: number) => {
      if (processingId !== null) return;

      Alert.alert("교환 요청 거절", "이 교환 요청을 거절하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "거절",
          style: "destructive",
          onPress: async () => {
            setProcessingId(requestId);
            try {
              const updateData: UpdateExchangeStatusDto = {
                status: ExchangeRequestStatus.REJECTED,
                message: "교환 요청을 거절했습니다.",
              };

              const response = await exchangeUpdateStatusAPI(requestId, updateData);

              if (response.resultType === "SUCCESS") {
                Alert.alert("거절 완료", "교환 요청을 거절했습니다.");
                resetRequests();
                loadRequests(fetchExchangeRequests(activeTab));
              } else {
                Alert.alert("오류", "교환 요청 거절에 실패했습니다.");
              }
            } catch (error) {
              Logger.error("교환 요청 거절 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]);
    },
    [loadRequests, resetRequests, fetchExchangeRequests, activeTab, processingId],
  );

  // [P1-1] 받은 교환 요청 아이템 렌더링 — ReceiveExchangeRequest flat 구조 접근
  const renderRequestItem = useCallback(
    ({ item }: { item: ReceiveExchangeRequest }) => (
      <View
        style={[
          styles.requestItem,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.requestHeader}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.statusText, { color: colors.muted }]}>
            {getItemStatusText(item.status)}
          </Text>
        </View>

        <View style={styles.requestInfo}>
          <Text style={[styles.requesterText, { color: colors.text }]}>
            요청자: {item.sender.userNickname}
          </Text>
          <Text style={[styles.dateText, { color: colors.muted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* 아이템이 아직 REGISTERED 상태일 때만 수락/거절 버튼 노출 */}
        {item.status === "REGISTERED" && (
          <View style={styles.actionButtons}>
            {/* [RC-2] processingId guard — 처리 중에는 모든 버튼 비활성 */}
            <TouchableOpacity
              style={[
                styles.acceptButton,
                { backgroundColor: processingId !== null ? colors.muted : colors.primary },
              ]}
              onPress={() => handleAcceptRequest(item.exchangeRequestId)}
              disabled={processingId !== null}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {processingId === item.exchangeRequestId ? "처리 중..." : "수락"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rejectButton,
                { backgroundColor: processingId !== null ? colors.muted : colors.destructive },
              ]}
              onPress={() => handleRejectRequest(item.exchangeRequestId)}
              disabled={processingId !== null}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {processingId === item.exchangeRequestId ? "처리 중..." : "거절"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [colors, handleAcceptRequest, handleRejectRequest, processingId],
  );

  // [P1-1] 보낸 교환 요청 렌더링 (대기중, 수락됨, 거절됨 상태 표출만)
  const renderSentRequestItem = useCallback(
    ({ item }: { item: ReceiveExchangeRequest }) => (
      <View
        style={[
          styles.requestItem,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.requestHeader}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.statusText, { color: colors.muted }]}>
            {getItemStatusText(item.status)}
          </Text>
        </View>

        <View style={styles.requestInfo}>
          {/* 보낸 제안에서는 요청받은 상대방 정보가 없으므로 아이템 카테고리 표시 */}
          <Text style={[styles.requesterText, { color: colors.muted }]}>
            카테고리: {item.category === "TICKET" ? "티켓" : "굿즈"}
          </Text>
          <Text style={[styles.dateText, { color: colors.muted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    ),
    [colors],
  );

  // 로딩 상태
  if (requestsState.status === "loading") {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            로딩 중...
          </Text>
        </View>
      </SafeLayout>
    );
  }

  // 에러 상태
  if (requestsState.status === "error") {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {requestsState.error || "데이터를 불러오는데 실패했습니다."}
          </Text>
          <Button onPress={() => loadRequests(fetchExchangeRequests(activeTab))}>
            다시 시도
          </Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <View style={styles.container}>
        
        {/* 4~5 페이지 탭 컨트롤러 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={styles.tabArrowButton} 
            onPress={() => setActiveTab(activeTab === "receiver" ? "sender" : "receiver")}
          >
            <Text style={[styles.tabArrowIcon, { color: colors.text }]}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={[styles.tabTitle, { color: colors.text }]}>
            {activeTab === "receiver" ? "받은 제안" : "보낸 제안"}
          </Text>
          <TouchableOpacity 
            style={styles.tabArrowButton} 
            onPress={() => setActiveTab(activeTab === "receiver" ? "sender" : "receiver")}
          >
            <Text style={[styles.tabArrowIcon, { color: colors.text }]}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={requestsState.data}
          renderItem={activeTab === "receiver" ? renderRequestItem : renderSentRequestItem}
          keyExtractor={(item) => item.exchangeRequestId.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          // [ML-3] FlatList 렌더링 최적화 속성 추가
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {activeTab === "receiver" ? "받은 교환 요청이 없습니다." : "보낸 교환 요청이 없습니다."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.SCREEN,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.SECTION,
    paddingHorizontal: SPACING.COMPONENT,
  },
  tabArrowButton: {
    padding: SPACING.SMALL,
  },
  tabArrowIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContainer: {
    gap: SPACING.COMPONENT,
  },
  requestItem: {
    padding: SPACING.COMPONENT,
    borderRadius: 12,
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SMALL,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  statusText: {
    fontSize: 14,
  },
  requestInfo: {
    marginBottom: SPACING.COMPONENT,
  },
  requesterText: {
    fontSize: 16,
    marginBottom: SPACING.TINY,
  },
  dateText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.COMPONENT,
  },
  acceptButton: {
    flex: 1,
    padding: SPACING.COMPONENT,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectButton: {
    flex: 1,
    padding: SPACING.COMPONENT,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.SCREEN,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: SPACING.SECTION,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.SECTION * 2,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
