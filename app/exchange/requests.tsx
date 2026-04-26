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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
 * 교환 요청 진행 상태 텍스트 변환 (ExchangeStatus 기반)
 * [BUG FIX] 보낸 제안 탭에서 ItemStatus 대신 이 함수를 사용해야 함.
 * 수락 후에도 ItemStatus는 REGISTERED 유지 → "대기 중"으로 오표시되는 원인이었음.
 */
const getExchangeStatusText = (exchangeStatus: string): string => {
  switch (exchangeStatus) {
    case "PENDING":
      return "검토 중 (대기)";
    case "ACCEPTED":
      return "채팅 진행 중 ✔️";
    case "REJECTED":
      return "거절됨";
    case "COMPLETED":
      return "거래 완료";
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
  const queryClient = useQueryClient();

  const {
    data: requests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["exchangeRequests", activeTab],
    queryFn: async () => {
      if (!user?.accessToken) throw new Error("로그인이 필요합니다.");

      const response = await exchangeGetMyRequestsAPI(activeTab, 0, 20);

      if (response.resultType === "SUCCESS" && response.data) {
        let list = response.data.content || [];
        if (activeTab === "receiver") {
          list = list.filter((req) => req.exchangeStatus !== "REJECTED");
        }
        return list;
      }

      throw new Error(
        typeof response.error === "string"
          ? response.error
          : "교환 요청 목록을 불러올 수 없습니다.",
      );
    },
    enabled: !!user?.accessToken,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // 교환 요청 상태 변경 Mutation (Optimistic Update)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: ExchangeRequestStatus }) => {
      const updateData: UpdateExchangeStatusDto = { status };
      const response = await exchangeUpdateStatusAPI(requestId, updateData);
      if (response.resultType !== "SUCCESS") {
        throw new Error(
          (typeof response.error === "string"
            ? response.error
            : (response.error as any)?.message) || "요청 처리에 실패했습니다.",
        );
      }
      return { requestId, status, data: response.data };
    },
    onMutate: async ({ requestId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["exchangeRequests", activeTab] });
      const previousRequests = queryClient.getQueryData<ReceiveExchangeRequest[]>(["exchangeRequests", activeTab]);

      // Optimistic update
      queryClient.setQueryData<ReceiveExchangeRequest[]>(["exchangeRequests", activeTab], (old) => {
        if (!old) return [];
        return old.map((req) =>
          req.exchangeRequestId === requestId
            ? { ...req, exchangeStatus: status }
            : req
        );
      });

      return { previousRequests };
    },
    onError: (err, _variables, context) => {
      queryClient.setQueryData(["exchangeRequests", activeTab], context?.previousRequests);
      Logger.error("교환 요청 상태 변경 실패:", err);
      Alert.alert("오류", err.message || "네트워크 에러가 발생했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeRequests", activeTab] });
    },
  });

  // [RC-2] 교환 요청 수락
  const handleAcceptRequest = useCallback(
    async (requestId: number) => {
      if (updateStatusMutation.isPending) return;

      Alert.alert(
        "교환 요청 수락",
        "이 교환 요청을 수락하시겠습니까? 수락하면 1:1 채팅으로 이동합니다.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "수락",
            style: "default",
            onPress: () => {
              updateStatusMutation.mutate(
                { requestId, status: ExchangeRequestStatus.ACCEPTED },
                {
                  onSuccess: (result) => {
                    const roomId = result.data?.directRoomId ?? result.data?.roomId;
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
                  },
                }
              );
            },
          },
        ],
      );
    },
    [router, updateStatusMutation],
  );

  // [RC-2] 교환 요청 거절
  const handleRejectRequest = useCallback(
    async (requestId: number) => {
      if (updateStatusMutation.isPending) return;

      Alert.alert("교환 요청 거절", "이 교환 요청을 거절하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "거절",
          style: "destructive",
          onPress: () => {
            updateStatusMutation.mutate(
              { requestId, status: ExchangeRequestStatus.REJECTED },
              {
                onSuccess: () => {
                  Alert.alert("거절 완료", "교환 요청을 거절했습니다.");
                },
              }
            );
          },
        },
      ]);
    },
    [updateStatusMutation],
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

        {item.exchangeStatus === "PENDING" && item.status === "REGISTERED" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                { backgroundColor: updateStatusMutation.isPending ? colors.muted : colors.primary },
              ]}
              onPress={() => handleAcceptRequest(item.exchangeRequestId)}
              disabled={updateStatusMutation.isPending}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {updateStatusMutation.isPending && updateStatusMutation.variables?.requestId === item.exchangeRequestId ? "처리 중..." : "수락"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rejectButton,
                { backgroundColor: updateStatusMutation.isPending ? colors.muted : colors.destructive },
              ]}
              onPress={() => handleRejectRequest(item.exchangeRequestId)}
              disabled={updateStatusMutation.isPending}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {updateStatusMutation.isPending && updateStatusMutation.variables?.requestId === item.exchangeRequestId ? "처리 중..." : "거절"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* [UX FIX] ACCEPTED 상태: 채팅방 이동 버튼 노출 */}
        {item.exchangeStatus === "ACCEPTED" && item.directRoomId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/exchange/chat/${item.directRoomId}`)}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                채팅방 가기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [colors, handleAcceptRequest, handleRejectRequest, router, updateStatusMutation],
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
          {/*
           * [BUG FIX] 보낸 제안 탭에서 ExchangeStatus를 기반으로 상태 표시
           * 기존: item.status (ItemStatus) — 수락 후에도 REGISTERED라 항상 "대기 중"로 표시됨
           * 수정: item.exchangeStatus (ExchangeStatus) — ACCEPTED/REJECTED/PENDING 실제 진행 상태 표시
           */}
          <Text style={[
            styles.statusText,
            {
              color: item.exchangeStatus === "ACCEPTED"
                ? colors.primary
                : item.exchangeStatus === "REJECTED"
                  ? colors.destructive
                  : colors.muted,
            },
          ]}>
            {getExchangeStatusText(item.exchangeStatus)}
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

        {item.directRoomId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/exchange/chat/${item.directRoomId}`)}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                채팅방 가기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [colors, router],
  );

  // 로딩 상태
  if (isLoading) {
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
  if (isError) {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {error?.message || "데이터를 불러오는데 실패했습니다."}
          </Text>
          <Button onPress={() => refetch()}>
            다시 시도
          </Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <View style={styles.container}>
        
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>
            ← 뒤로가기
          </Text>
        </TouchableOpacity>

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
          data={requests}
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
  backButton: {
    paddingVertical: SPACING.SMALL,
    marginBottom: SPACING.SMALL,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
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
