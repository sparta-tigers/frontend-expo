import { Box, List, Typography, Button } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { itemsGetMyItemsAPI } from "@/src/features/exchange/api";
import { Item } from "@/src/features/exchange/types";
import { exchangeKeys } from "@/src/features/exchange/keys";
import { theme } from "@/src/styles/theme";
import { Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";

export default function MyItemsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: myItems = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: exchangeKeys.myItems(),
    queryFn: async () => {
      const response = await itemsGetMyItemsAPI(0, 50);
      return response?.data?.content ?? [];
    },
    staleTime: 60_000,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <TouchableOpacity
        onPress={() => router.push(`/exchange/${item.id}` as Href)}
        activeOpacity={0.8}
      >
        <Box
          p="md"
          mb="sm"
          rounded="md"
          borderWidth={1}
          bg="surface"
          borderColor="border.medium"
        >
          <Box flexDir="row" justify="space-between" align="center" mb="sm">
            <Typography
              variant="body1"
              weight="bold"
              color="text.primary"
              style={styles.itemTitle}
              numberOfLines={1}
            >
              {item.title}
            </Typography>
            <Typography variant="caption" weight="bold" color="primary">
              {item.category === "TICKET" ? "티켓" : "굿즈"}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            numberOfLines={2}
            mb="md"
            minHeight={36}
          >
            {item.description}
          </Typography>
          <Box flexDir="row" justify="space-between" align="center">
            <Typography variant="caption" color="text.secondary">
              {new Date(item.createdAt).toLocaleDateString()}
            </Typography>
            <Box px="sm" py="xxs" rounded="sm" bg="text.secondary">
              <Typography
                variant="caption"
                weight="semibold"
                color="background"
              >
                활성
              </Typography>
            </Box>
          </Box>
        </Box>
      </TouchableOpacity>
    ),
    [router],
  );

  return (
    <SafeLayout style={styles.container}>
      {/* 헤더 바 */}
      <Box
        flexDir="row"
        align="center"
        justify="center"
        py="md"
        px="SCREEN"
        borderBottomWidth={1}
        borderColor="border.medium"
      >
        <Typography variant="h3" weight="bold" color="text.primary">
          내가 등록한 물건
        </Typography>
      </Box>

      {/* 목록 본문 */}
      {isLoading && !refreshing ? (
        <Box flex={1} justify="center" align="center">
          <Typography color="text.secondary">불러오는 중...</Typography>
        </Box>
      ) : isError && myItems.length === 0 ? (
        <Box flex={1} justify="center" align="center">
          <Typography color="text.secondary" mb="md">
            정보를 불러올 수 없습니다.
          </Typography>
          <Button onPress={() => refetch()}>다시 시도</Button>
        </Box>
      ) : myItems.length === 0 ? (
        <Box flex={1} justify="center" align="center">
          <Typography color="text.secondary">
            현재 활성화된 등록 물건이 없습니다.
          </Typography>
        </Box>
      ) : (
        <List
          data={myItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.SCREEN,
  },
  itemTitle: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
});
