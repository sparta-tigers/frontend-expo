import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SafeLayout } from "@/components/ui/safe-layout";
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
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
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

  const renderExchangeRequest = ({ item }: { item: ReceiveExchangeRequest }) => {
    const statusColor =
      item.exchangeStatus === ExchangeRequestStatus.PENDING
        ? theme.colors.warning
        : item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
          ? theme.colors.success
          : theme.colors.error;

    return (
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Text style={styles.itemTitle}>
            {item.title || "아이템 정보 없음"}
          </Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {item.exchangeStatus === ExchangeRequestStatus.PENDING
              ? "대기 중"
              : item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
                ? "수락됨"
                : "거절됨"}
          </Text>
        </View>

        <Text style={styles.requester}>
          요청자: {item.sender.userNickname || "알 수 없음"}
        </Text>

        <Text style={styles.date}>
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
  };

  if (loading) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            교환 요청 목록을 불러오는 중...
          </Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.safeLayout}>
      <View style={styles.container}>
        <Text style={styles.title}>
          받은 교환 요청
        </Text>

        {exchangeRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
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

// ========================================================
// Styles — Co-location 유지, 하드코딩 제거
// ========================================================
const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.SCREEN,
  },
  title: {
    fontSize: theme.typography.size.TITLE,
    fontWeight: theme.typography.weight.bold,
    marginBottom: theme.spacing.SCREEN,
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.typography.size.BODY,
    textAlign: "center",
    color: theme.colors.text.secondary,
  },
  listContainer: {
    gap: theme.spacing.COMPONENT,
  },
  requestCard: {
    padding: theme.spacing.SCREEN,
    marginBottom: theme.spacing.SMALL,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.SMALL,
  },
  itemTitle: {
    fontSize: theme.typography.size.CARD_TITLE,
    fontWeight: theme.typography.weight.semibold,
    flex: 1,
    color: theme.colors.text.primary,
  },
  status: {
    fontSize: theme.typography.size.CAPTION,
    fontWeight: theme.typography.weight.semibold,
    paddingHorizontal: theme.spacing.SMALL,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  requester: {
    fontSize: theme.typography.size.BODY,
    marginBottom: theme.spacing.SMALL,
    color: theme.colors.text.primary,
  },
  date: {
    fontSize: theme.typography.size.CAPTION,
    marginBottom: theme.spacing.COMPONENT,
    color: theme.colors.text.secondary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.SMALL,
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
