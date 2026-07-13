import { Box, Button, List, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useExchangeRequests } from "@/src/features/exchange/hooks/useExchangeRequests";
import {
  ExchangeRequestStatus,
  ReceiveExchangeRequest,
} from "@/src/features/exchange/types";
import { theme } from "@/src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

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
    fetchRequests,
  } = useExchangeRequests(activeTab);

  const onAccept = useCallback(
    async (id: number) => {
      Alert.alert("교환 수락", "이 교환 요청을 수락할까요?", [
        { text: "닫기", style: "cancel" },
        {
          text: "수락",
          onPress: async () => {
            try {
              await handleAccept(id);
              Alert.alert(
                "성공",
                "교환 요청을 수락했어요. 채팅방에서 대화를 시작하세요!",
              );
            } catch {
              Alert.alert("알림", "수락하지 못했어요.");
            }
          },
        },
      ]);
    },
    [handleAccept],
  );

  const onReject = useCallback(
    async (id: number) => {
      Alert.alert("교환 거절", "이 교환 요청을 거절할까요?", [
        { text: "닫기", style: "cancel" },
        {
          text: "거절",
          onPress: async () => {
            try {
              await handleReject(id);
              Alert.alert("성공", "교환 요청을 거절했어요.");
            } catch {
              Alert.alert("알림", "거절하지 못했어요.");
            }
          },
          style: "destructive",
        },
      ]);
    },
    [handleReject],
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: ReceiveExchangeRequest }) => (
      <Box
        bg="card"
        rounded="lg"
        p="lg"
        borderWidth={1}
        borderColor="border.medium"
        style={theme.shadow.card}
      >
        <Box flexDir="row" justify="space-between" align="center" mb="sm">
          <Typography variant="h3" weight="bold" color="text.primary" flex={1}>
            {item.title}
          </Typography>
          <Typography
            variant="body2"
            weight="semibold"
            color={
              item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
                ? "success"
                : item.exchangeStatus === ExchangeRequestStatus.REJECTED
                  ? "error"
                  : "primary"
            }
          >
            {item.exchangeStatus === ExchangeRequestStatus.PENDING
              ? "대기 중"
              : item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
                ? "수락됨"
                : item.exchangeStatus === ExchangeRequestStatus.REJECTED
                  ? "거절됨"
                  : "완료됨"}
          </Typography>
        </Box>

        <Box mb="lg">
          {activeTab === "receiver" ? (
            <Typography variant="body2" color="text.secondary" mb="xxs">
              요청자: {item.sender.userNickname}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary" mb="xxs">
            카테고리: {item.category === "TICKET" ? "티켓" : "굿즈"}
          </Typography>
          <Typography variant="caption" color="text.tertiary">
            요청일: {new Date(item.createdAt).toLocaleDateString()}
          </Typography>
        </Box>

        {item.exchangeStatus === ExchangeRequestStatus.PENDING &&
        activeTab === "receiver" ? (
          <Box flexDir="row" gap="md">
            <Box flex={1}>
              <Button onPress={() => onAccept(item.exchangeRequestId)}>
                수락
              </Button>
            </Box>
            <Box flex={1}>
              <Button
                variant="outline"
                onPress={() => onReject(item.exchangeRequestId)}
              >
                거절
              </Button>
            </Box>
          </Box>
        ) : null}

        {item.exchangeStatus === ExchangeRequestStatus.ACCEPTED &&
        item.directRoomId ? (
          <Box mt="md">
            <Button
              onPress={() => router.push(`/exchange/chat/${item.directRoomId}`)}
            >
              채팅방으로 이동
            </Button>
          </Box>
        ) : null}
      </Box>
    ),
    [activeTab, onAccept, onReject, router],
  );

  if (loading && !refreshing && requests.length === 0) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <Typography color="text.primary">로딩 중...</Typography>
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.safeLayout}>
      <Box flex={1}>
        <Box
          flexDir="row"
          align="center"
          justify="space-between"
          mb="lg"
          px="md"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Typography variant="h2" weight="bold" center flex={1}>
            교환 요청
          </Typography>
          <Box width={40} />
        </Box>

        <Box flexDir="row" mb="lg" px="md" gap="md">
          <TouchableOpacity
            style={[styles.tab, activeTab === "receiver" && styles.activeTab]}
            onPress={() => setActiveTab("receiver")}
          >
            <Typography
              weight="semibold"
              color={activeTab === "receiver" ? "card" : "text.secondary"}
            >
              받은 요청
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "sender" && styles.activeTab]}
            onPress={() => setActiveTab("sender")}
          >
            <Typography
              weight="semibold"
              color={activeTab === "sender" ? "card" : "text.secondary"}
            >
              보낸 요청
            </Typography>
          </TouchableOpacity>
        </Box>

        <List
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.exchangeRequestId.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <Box flex={1} justify="center" align="center" p="lg">
              <Typography center color="text.secondary" mb="lg">
                {error
                  ? `문제가 생겼어요: ${error}`
                  : activeTab === "receiver"
                    ? "아직 받은 교환 요청이 없어요."
                    : "아직 보낸 교환 요청이 없어요."}
              </Typography>
              {(requests.length === 0 || error) && !loading ? (
                <Button onPress={() => fetchRequests()}>다시 시도</Button>
              ) : null}
            </Box>
          }
        />
      </Box>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.sm,
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
  listContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
});
