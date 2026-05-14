import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useInfiniteMyAttendances } from "@/src/features/match-attendance/queries";
import { MatchAttendance } from "@/src/features/match-attendance/types";
import { useFavoriteTeam } from "@/src/features/user/queries";
import { theme } from "@/src/styles/theme";
import { calculateMatchResult } from "@/src/utils/match";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

/**
 * 🚨 [Phase 24] 직관 기록 목록 화면 (Match Diary)
 *
 * Why: 사용자가 과거에 기록한 직관 일기들을 타임라인 형태로 확인하고 관리함.
 */
export default function HistoryScreen() {
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMyAttendances(10);
  const { data: favoriteTeam, isLoading: isFavLoading } = useFavoriteTeam();

  const attendances = data?.pages.flatMap((page) => page.data?.content || []) || [];


  // 🚨 [Phase 2-3] Pull-to-refresh 상태 동기화
  const onRefresh = async () => {
    await refetch();
  };

  const getMatchResult = (item: MatchAttendance) => {
    return calculateMatchResult(
      item.homeScore,
      item.awayScore,
      item.homeTeamCode,
      item.awayTeamCode,
      favoriteTeam?.teamCode,
    );
  };

  const renderAttendanceItem = ({ item }: { item: MatchAttendance }) => {
    const matchDate = new Date(item.matchTime);
    const dateString = `${matchDate.getFullYear()}.${String(matchDate.getMonth() + 1).padStart(2, "0")}.${String(matchDate.getDate()).padStart(2, "0")}`;
    const result = getMatchResult(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/attendance/detail/${item.id}`)}
        style={styles.cardContainer}
      >
        <Box
          bg="brand.mintAlpha10"
          p="md"
          rounded="lg"
          flexDir="row"
          align="center"
          style={styles.attendanceCard}
        >
          <Box flex={1}>
            <Box flexDir="row" align="center" mb="xs">
              <Typography variant="body1" weight="bold">
                {item.homeTeamName}
              </Typography>
              <Typography variant="caption" color="text.secondary" mx="xs">
                vs
              </Typography>
              <Typography variant="body1" weight="bold">
                {item.awayTeamName}
              </Typography>
            </Box>

            <Box flexDir="row" align="center" mb="xxs">
              <Ionicons
                name="calendar-outline"
                size={14}
                color={theme.colors.text.secondary}
              />
              <Typography variant="caption" color="text.secondary" ml="xxs">
                {dateString}
              </Typography>
            </Box>

            <Box flexDir="row" align="center">
              <Ionicons
                name="location-outline"
                size={14}
                color={theme.colors.text.secondary}
              />
              <Typography variant="caption" color="text.secondary" ml="xxs">
                {item.seat}
              </Typography>
            </Box>
          </Box>

          <Box width={1} height="80%" bg="team.neutralLight" mx="md" />

          <Box align="center" justify="center" width={50}>
            <Typography style={styles.resultEmoji}>
              {result?.emoji ?? "🏟️"}
            </Typography>
            <Typography
              variant="caption"
              weight="bold"
              color={result?.color ?? "text.secondary"}
            >
              {result?.text ?? "MATCH"}
            </Typography>
          </Box>
        </Box>
      </TouchableOpacity>
    );
  };

  if (isLoading || isFavLoading) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <ActivityIndicator color={theme.colors.brand.mint} />
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.safeLayout}>
      <Box flex={1} p="SCREEN">
        <Typography variant="h2" weight="bold" color="text.primary" mb="SCREEN">
          나의 직관 일기
        </Typography>

        {attendances && attendances.length > 0 ? (
          <FlatList
            data={attendances}
            renderItem={renderAttendanceItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onRefresh={onRefresh}
            refreshing={isRefetching}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <Box py="md">
                  <ActivityIndicator color={theme.colors.brand.mint} />
                </Box>
              ) : null
            }
          />
        ) : (
          <Box flex={1} justify="center" align="center">
            <Typography
              variant="h2"
              color="text.primary"
              weight="bold"
              center
              mb="sm"
            >
              아직 기록된 직관이 없어요
            </Typography>
            <Typography variant="body2" color="text.secondary" center mb="md">
              첫 직관 일기를 작성하고{"\n"}캘린더를 채워보세요!
            </Typography>
          </Box>
        )}
      </Box>

      {/* Floating Action Button for Adding Record */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push("/schedule")}
      >
        <Ionicons name="add" size={32} color={theme.colors.background} />
      </TouchableOpacity>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    paddingBottom: theme.spacing.SCREEN * 2,
  },
  cardContainer: {
    marginBottom: theme.spacing.sm,
  },
  attendanceCard: {
    borderWidth: 1,
    borderColor: theme.colors.brand.mintAlpha10,
  },
  resultEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  fab: {
    position: "absolute",
    bottom: theme.spacing.SCREEN + 80, // 탭 바 높이 고려
    right: theme.spacing.SCREEN,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.brand.mint,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadow.card,
  },
});
