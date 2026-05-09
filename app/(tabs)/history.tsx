import { Button } from "@/components/ui/button";
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
import { Alert, FlatList, StyleSheet } from "react-native";
import { Box, Typography } from "@/components/ui";

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
      Logger.error("교환 요청 목록 로딩 중 에러 발생", error);
      Alert.alert("오류", "교환 요청 목록을 불러올 수 없습니다.");
      throw error; // 🚨 [Senior Architect] Critical 에러 전파
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
        Logger.error("교환 상태 업데이트 중 에러 발생", error);
        Alert.alert("오류", "네트워크 에러가 발생했습니다.");
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
    const statusColor: keyof typeof theme.colors =
      item.exchangeStatus === ExchangeRequestStatus.PENDING
        ? "warning"
        : item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
          ? "success"
          : "error";

    return (
      <Box bg="card" p="SCREEN" rounded="lg" mb="sm" style={theme.shadow.card}>
        <Box flexDir="row" justify="space-between" align="center" mb="sm">
          <Typography variant="body2" weight="semibold" color="text.primary" style={styles.itemTitle}>
            {item.title || "아이템 정보 없음"}
          </Typography>
          <Box 
            bg="surface" 
            px="sm" 
            py="xxs" 
            rounded="sm" 
            style={[styles.statusBadge, { borderColor: theme.colors[statusColor] }]}
          >
            <Typography variant="caption" color={statusColor} weight="semibold">
              {item.exchangeStatus === ExchangeRequestStatus.PENDING
                ? "대기 중"
                : item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
                  ? "수락됨"
                  : "거절됨"}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.primary" mb="sm">
          요청자: {item.sender.userNickname || "알 수 없음"}
        </Typography>

        <Typography variant="caption" color="text.secondary" mb="md">
          요청일: {new Date(item.createdAt).toLocaleDateString()}
        </Typography>

        {item.exchangeStatus === ExchangeRequestStatus.PENDING && (
          <Box flexDir="row" gap="sm">
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading === item.exchangeRequestId}
              onPress={() =>
                handleUpdateStatus(item.exchangeRequestId, ExchangeRequestStatus.ACCEPTED)
              }
              style={styles.flexButton}
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
              style={styles.flexButton}
            >
              거절
            </Button>
          </Box>
        )}

        {item.exchangeStatus === ExchangeRequestStatus.ACCEPTED && item.directRoomId && (
          <Box flexDir="row">
            <Button
              variant="primary"
              size="sm"
              onPress={() => router.push(`/exchange/chat/${item.directRoomId}`)}
              style={styles.flexButton}
            >
              채팅방 가기
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <Typography variant="body2" color="text.primary">
            교환 요청 목록을 불러오는 중...
          </Typography>
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.safeLayout}>
      <Box flex={1} p="SCREEN">
        <Typography variant="h2" weight="bold" color="text.primary" mb="SCREEN">
          받은 교환 요청
        </Typography>

        {exchangeRequests.length === 0 ? (
          <Box flex={1} justify="center" align="center">
            <Typography variant="body2" color="text.secondary" center>
              받은 교환 요청이 없습니다.
            </Typography>
          </Box>
        ) : (
          <FlatList
            data={exchangeRequests}
            renderItem={renderExchangeRequest}
            keyExtractor={(item) => item.exchangeRequestId.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    gap: theme.spacing.COMPONENT,
  },
  itemTitle: {
    flex: 1,
  },
  flexButton: {
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: theme.radius.sm,
  },
});
