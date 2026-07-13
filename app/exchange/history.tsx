import { Box, List, Typography } from '@/components/ui';
import { SafeLayout } from '@/components/ui/safe-layout';
import { exchangeGetMyRequestsAPI } from '@/src/features/exchange/api';
import { ExchangeRequestStatus, ReceiveExchangeRequest } from '@/src/features/exchange/types';
import { theme } from '@/src/styles/theme';
import { exchangeKeys } from '@/src/features/exchange/keys';

import { useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

/**
 * 교환 완료 내역 화면
 * 사용자가 완료(승낙/거절)한 모든 교환 요청 내역을 표시합니다.
 */
export default function ExchangeHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: history = [],
    isLoading: loading,
    isError,
    refetch: loadHistory,
  } = useQuery({
    queryKey: exchangeKeys.requests('receiver'),
    queryFn: async () => {
      const response = await exchangeGetMyRequestsAPI('receiver', 0, 50);
      if (response.resultType === 'SUCCESS' && response.data) {
        return response.data.content.filter(
          (item) => item.exchangeStatus !== ExchangeRequestStatus.PENDING,
        );
      }
      return [];
    },
    staleTime: 60_000,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const renderHistoryItem = useCallback(
    ({ item }: { item: ReceiveExchangeRequest }) => (
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
              item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
                ? 'success'
                : item.exchangeStatus === ExchangeRequestStatus.REJECTED
                  ? 'error'
                  : 'text.tertiary'
            }
          >
            <Typography variant="label" weight="bold" color="card">
              {item.exchangeStatus === ExchangeRequestStatus.ACCEPTED
                ? '승낙'
                : item.exchangeStatus === ExchangeRequestStatus.REJECTED
                  ? '거절'
                  : '완료'}
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
          카테고리: {item.category === 'TICKET' ? '티켓' : '굿즈'}
        </Typography>

        <Box pt="md" borderTopWidth={1} style={styles.itemFooter}>
          <Typography variant="body2" weight="medium" color="text.primary">
            상대방: {item.sender.userNickname}
          </Typography>
        </Box>
      </Box>
    ),
    [],
  );

  if (loading && !refreshing) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </Box>
      </SafeLayout>
    );
  }

  if (isError && history.length === 0) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <Typography color="text.secondary" mb="md">
            교환 내역을 불러오지 못했어요. 다시 시도해주세요.
          </Typography>
          <Button onPress={() => loadHistory()}>다시 시도</Button>
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.safeLayout}>
      <Box flex={1}>
        <Box flexDir="row" align="center" justify="space-between" mb="md" px="md">
          <Box width={40} />
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
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <Box flex={1} justify="center" align="center" pt="SECTION">
              <Typography variant="body1" color="text.secondary">
                아직 교환 내역이 없어요.
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
