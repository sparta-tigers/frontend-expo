import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import {
  exchangeGetReceivedAPI,
  exchangeUpdateStatusAPI,
} from "@/src/features/exchange/api";
import {
  ExchangeRequestStatus,
  ReceiveExchangeRequest,
  UpdateExchangeStatusDto,
} from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [exchangeRequests, setExchangeRequests] = useState<ReceiveExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // 받은 교환 요청 목록 조회
  const fetchExchangeRequests = useCallback(async () => {
    if (!user?.accessToken) return;

    try {
      setLoading(true);
      const response = await exchangeGetReceivedAPI(0, 20);

      if (response.resultType === "SUCCESS" && response.data) {
        setExchangeRequests(response.data.content);
      }
    } catch (error) {
      Logger.error(
        "교환 요청 목록 로딩 실패:",
        error instanceof Error ? error.message : String(error),
      );
      Alert.alert("오류", "교환 요청 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 교환 요청 상태 업데이트 (수락/거절)
  const handleUpdateStatus = useCallback(
    async (requestId: number, status: ExchangeRequestStatus) => {
      const request: UpdateExchangeStatusDto = {
        status,
      };

      try {
        setActionLoading(requestId);
        const response = await exchangeUpdateStatusAPI(requestId, request);

        if (response.resultType === "SUCCESS") {
          Alert.alert(
            "성공",
            status === ExchangeRequestStatus.ACCEPTED
              ? "교환을 수락했습니다."
              : "교환을 거절했습니다.",
            [{ text: "확인" }],
          );

          // 목록 새로고침
          fetchExchangeRequests();
        } else {
          Alert.alert("오류", "상태 업데이트에 실패했습니다.");
        }
      } catch (error) {
        if (error instanceof Error) {
          Logger.error("상태 업데이트 실패:", error.message);
          Alert.alert("오류", "네트워크 에러가 발생했습니다.");
        } else {
          Logger.error("상태 업데이트 실패:", String(error));
          Alert.alert("오류", "알 수 없는 에러가 발생했습니다.");
        }
      } finally {
        setActionLoading(null);
      }
    },
    [fetchExchangeRequests],
  );

  useEffect(() => {
    fetchExchangeRequests();
  }, [fetchExchangeRequests]);

  const renderExchangeRequest = ({ item }: { item: ReceiveExchangeRequest }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>
          {item.title || "아이템 정보 없음"}
        </Text>
        <Text
          style={[
            styles.status,
            {
              color:
                item.exchangeStatus === ExchangeRequestStatus.PENDING
                  ? colors.warning
                  : item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
                    ? colors.success
                    : colors.destructive,
            },
          ]}
        >
          {item.exchangeStatus === ExchangeRequestStatus.PENDING
            ? "대기 중"
            : item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
              ? "수락됨"
              : "거절됨"}
        </Text>
      </View>

      <Text style={[styles.requester, { color: colors.text }]}>
        요청자: {item.sender.userNickname || "알 수 없음"}
      </Text>

      <Text style={[styles.date, { color: colors.muted }]}>
        요청일: {new Date(item.createdAt).toLocaleDateString()}
      </Text>

      {item.exchangeStatus === ExchangeRequestStatus.PENDING && (
        <View style={styles.actionButtons}>
          <Button
            variant="primary"
            size="sm"
            loading={actionLoading === item.exchangeRequestId}
            onPress={() =>
              handleUpdateStatus(item.exchangeRequestId, ExchangeRequestStatus.ACCEPTED)
            }
            style={styles.acceptButton}
          >
            수락
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={actionLoading === item.exchangeRequestId}
            onPress={() =>
              handleUpdateStatus(item.exchangeRequestId, ExchangeRequestStatus.REJECTED)
            }
            style={styles.rejectButton}
          >
            거절
          </Button>
        </View>
      )}

      {item.exchangeStatus === ExchangeRequestStatus.ACCEPTED && item.directRoomId && (
        <View style={styles.actionButtons}>
          <Button
            variant="primary"
            size="sm"
            onPress={() => router.push(`/exchange/chat/${item.directRoomId}`)}
            style={styles.chatButton}
          >
            채팅방 가기
          </Button>
        </View>
      )}
    </Card>
  );

  if (loading) {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            교환 요청 목록을 불러오는 중...
          </Text>
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

        {exchangeRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              받은 교환 요청이 없습니다.
            </Text>
          </View>
        ) : (
          <FlatList
            data={exchangeRequests}
            renderItem={renderExchangeRequest}
            keyExtractor={(item) => item.exchangeRequestId.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    marginBottom: SPACING.SCREEN,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  listContainer: {
    gap: SPACING.COMPONENT,
  },
  requestCard: {
    padding: SPACING.SCREEN,
    marginBottom: SPACING.SMALL,
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
  status: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requester: {
    fontSize: 16,
    marginBottom: SPACING.SMALL,
  },
  date: {
    fontSize: 14,
    marginBottom: SPACING.COMPONENT,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.SMALL,
  },
  acceptButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  chatButton: {
    flex: 1,
  },
});
