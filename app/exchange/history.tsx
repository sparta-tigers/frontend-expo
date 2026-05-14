import { theme } from "@/src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Box, Typography, List } from "@/components/ui";
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

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
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

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  const renderHistoryItem = useCallback(({ item }: { item: ReceiveExchangeRequest }) => (
    <Box 
      bg="card" 
      rounded="lg" 
      p="lg" 
      borderWidth={1} 
      borderColor="border.medium" 
      style={theme.shadow.card}
    >
      <Box flexDir="row" justify="space-between" align="center" mb="md">
        <Box 
          px="sm" 
          py="xxs" 
          rounded="full" 
          bg={
            item.exchangeStatus === ExchangeRequestStatus.ACCEPTED ? "success" : 
            item.exchangeStatus === ExchangeRequestStatus.REJECTED ? "error" : "text.tertiary"
          }
        >
          <Typography variant="label" weight="bold" color="card">
            {item.exchangeStatus === ExchangeRequestStatus.ACCEPTED ? "승낙" : 
             item.exchangeStatus === ExchangeRequestStatus.REJECTED ? "거절" : "완료"}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.tertiary">
          {new Date(item.createdAt).toLocaleDateString()}
        </Typography>
      </Box>

      <Typography variant="h3" weight="bold" mb="xxs" color="text.primary">
        {item.title}
      </Typography>
      <Typography variant="body2" weight="semibold" color="primary" mb="sm">
        카테고리: {item.category === "TICKET" ? "티켓" : "굿즈"}
      </Typography>

      <Box pt="md" borderTopWidth={1} style={styles.itemFooter}>
        <Typography variant="body2" weight="medium" color="text.primary">
          상대방: {item.sender.userNickname}
        </Typography>
      </Box>
    </Box>
  ), []);

  if (loading && !refreshing) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.safeLayout}>
      <Box flex={1}>
        <Box flexDir="row" align="center" justify="space-between" mb="md" px="md">
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Typography variant="h2" weight="bold" center style={styles.headerTitle}>
            교환 내역
          </Typography>
          <Box width={40} />
        </Box>

        <List
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.exchangeRequestId.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => loadHistory(true)}
          refreshing={refreshing}
          ListEmptyComponent={
            <Box flex={1} justify="center" align="center" pt="SECTION">
              <Typography variant="body1" color="text.secondary">
                교환 내역이 없습니다.
              </Typography>
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
    padding: theme.spacing.xs,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  headerTitle: {
    flex: 1,
  },
  itemFooter: {
    borderTopColor: theme.colors.border.medium,
  },
});
