import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import {
    exchangeGetReceivedAPI,
    exchangeUpdateStatusAPI,
} from "@/src/features/exchange/api";
import {
    ExchangeRequest,
    ExchangeRequestStatus,
    UpdateExchangeStatusDto,
} from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { SPACING } from "@/src/styles/unified-design";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
 * 받은 교환 요청 목록 화면
 * 유저가 받은 교환 요청을 수락/거절할 수 있는 화면
 */
export default function ExchangeRequestsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  // useAsyncState 훅으로 교환 요청 목록 상태 관리
  const [requestsState, loadRequests] = useAsyncState<ExchangeRequest[]>([]);

  // 교환 요청 목록 로드
  const fetchExchangeRequests = useCallback(async () => {
    if (!user?.accessToken) throw new Error("로그인이 필요합니다.");

    const response = await exchangeGetReceivedAPI(0, 20);

    if (response.resultType === "SUCCESS" && response.data) {
      const requestData = response.data.content || [];
      return requestData;
    }

    throw new Error(
      typeof response.error === "string"
        ? response.error
        : "교환 요청 목록을 불러올 수 없습니다.",
    );
  }, [user?.accessToken]);

  // 초기 데이터 로드
  useEffect(() => {
    loadRequests(fetchExchangeRequests());
  }, [loadRequests, fetchExchangeRequests]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests(fetchExchangeRequests()).finally(() => setRefreshing(false));
  }, [fetchExchangeRequests, loadRequests]);

  // 교환 요청 수락
  const handleAcceptRequest = useCallback(
    async (requestId: number) => {
      Alert.alert(
        "교환 요청 수락",
        "이 교환 요청을 수락하시겠습니까? 수락하면 1:1 채팅으로 이동합니다.",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "수락",
            style: "default",
            onPress: async () => {
              try {
                const updateData: UpdateExchangeStatusDto = {
                  status: ExchangeRequestStatus.ACCEPTED,
                  message: "교환 요청을 수락했습니다.",
                };

                const response = await exchangeUpdateStatusAPI(
                  requestId,
                  updateData,
                );

                if (response.resultType === "SUCCESS") {
                  const responseData = response.data as unknown;
                  const roomId =
                    typeof responseData === "object" && responseData !== null
                      ? ((
                          responseData as {
                            roomId?: number;
                            directRoomId?: number;
                          }
                        ).roomId ??
                        (
                          responseData as {
                            roomId?: number;
                            directRoomId?: number;
                          }
                        ).directRoomId)
                      : undefined;

                  if (!roomId) {
                    Alert.alert(
                      "오류",
                      "채팅방 ID를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.",
                    );
                    return;
                  }

                  Alert.alert(
                    "수락 완료",
                    "교환 요청을 수락했습니다. 채팅으로 이동합니다.",
                    [
                      {
                        text: "확인",
                        onPress: () => {
                          router.push(`/exchange/chat/${roomId}`);
                        },
                      },
                    ],
                  );
                } else {
                  Alert.alert("오류", "교환 요청 수락에 실패했습니다.");
                }
              } catch (error) {
                console.error("교환 요청 수락 실패:", error);
                Alert.alert("오류", "네트워크 에러가 발생했습니다.");
              }
            },
          },
        ],
      );
    },
    [router],
  );

  // 교환 요청 거절
  const handleRejectRequest = useCallback(
    async (requestId: number) => {
      Alert.alert("교환 요청 거절", "이 교환 요청을 거절하시겠습니까?", [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "거절",
          style: "destructive",
          onPress: async () => {
            try {
              const updateData: UpdateExchangeStatusDto = {
                status: ExchangeRequestStatus.REJECTED,
                message: "교환 요청을 거절했습니다.",
              };

              const response = await exchangeUpdateStatusAPI(
                requestId,
                updateData,
              );

              if (response.resultType === "SUCCESS") {
                Alert.alert("거절 완료", "교환 요청을 거절했습니다.");
                // 목록 새로고침
                loadRequests(fetchExchangeRequests());
              } else {
                Alert.alert("오류", "교환 요청 거절에 실패했습니다.");
              }
            } catch (error) {
              console.error("교환 요청 거절 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            }
          },
        },
      ]);
    },
    [loadRequests, fetchExchangeRequests],
  );

  // 교환 요청 아이템 렌더링
  const renderRequestItem = useCallback(
    ({ item }: { item: ExchangeRequest }) => (
      <View
        style={[
          styles.requestItem,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.requestHeader}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.item?.title}
          </Text>
          <Text style={[styles.statusText, { color: colors.muted }]}>
            상태: {getStatusText(item.status)}
          </Text>
        </View>

        <View style={styles.requestInfo}>
          <Text style={[styles.requesterText, { color: colors.text }]}>
            요청자: {item.requester?.nickname}
          </Text>
          <Text style={[styles.dateText, { color: colors.muted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {item.status === ExchangeRequestStatus.PENDING && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                수락
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rejectButton,
                { backgroundColor: colors.destructive },
              ]}
              onPress={() => handleRejectRequest(item.id)}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                거절
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [colors, handleAcceptRequest, handleRejectRequest],
  );

  // 상태 텍스트 변환
  const getStatusText = (status: ExchangeRequestStatus): string => {
    switch (status) {
      case ExchangeRequestStatus.PENDING:
        return "대기 중";
      case ExchangeRequestStatus.ACCEPTED:
        return "수락됨";
      case ExchangeRequestStatus.REJECTED:
        return "거절됨";
      case ExchangeRequestStatus.COMPLETED:
        return "완료됨";
      default:
        return "알 수 없음";
    }
  };

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
          <Button onPress={() => loadRequests(fetchExchangeRequests())}>
            다시 시도
          </Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          받은 교환 요청
        </Text>

        <FlatList
          data={requestsState.data}
          renderItem={renderRequestItem}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                받은 교환 요청이 없습니다.
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: SPACING.SECTION,
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
