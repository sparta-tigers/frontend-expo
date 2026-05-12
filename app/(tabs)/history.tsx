import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useMyAttendances } from "@/src/features/match-attendance/queries";
import { MatchAttendance } from "@/src/features/match-attendance/types";
import { theme } from "@/src/styles/theme";
import { router } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Image } from "expo-image";

/**
 * 🚨 [Phase 24] 직관 기록 목록 화면 (Match Diary)
 * 
 * Why: 사용자가 과거에 기록한 직관 일기들을 타임라인 형태로 확인하고 관리함.
 * Zero-Magic: TanStack Query를 통해 서버 상태를 동기화하고, 결정론적 UI를 렌더링함.
 */
export default function HistoryScreen() {
  const { data: attendances, isLoading, refetch } = useMyAttendances(1, 100);

  const renderAttendanceItem = ({ item }: { item: MatchAttendance }) => {
    const matchDate = new Date(item.matchTime);
    const dateString = `${matchDate.getMonth() + 1}월 ${matchDate.getDate()}일`;
    
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => router.push(`/attendance/${item.matchId}`)}
        style={styles.cardContainer}
      >
        <Box bg="card" p="SCREEN" rounded="lg" style={theme.shadow.card}>
          <Box flexDir="row" justify="space-between" align="center" mb="xs">
            <Typography variant="caption" color="text.secondary">
              {dateString} • {item.seat}
            </Typography>
          </Box>

          <Typography variant="body1" weight="bold" color="text.primary" mb="sm">
            {item.homeTeamName} vs {item.awayTeamName}
          </Typography>

          {item.imageUrls && item.imageUrls.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.thumbnailList}
              contentContainerStyle={styles.thumbnailContent}
            >
              {item.imageUrls.map((url, index) => (
                <Image 
                  key={`${item.id}-img-${index}`}
                  source={{ uri: url }} 
                  style={styles.thumbnail}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          )}

          <Typography 
            variant="body2" 
            color="text.secondary" 
            numberOfLines={2}
            style={styles.contentsText}
          >
            {item.contents}
          </Typography>
        </Box>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
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
          나의 직관 기록
        </Typography>

        {attendances && attendances.length > 0 ? (
          <FlatList
            data={attendances}
            renderItem={renderAttendanceItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
          />
        ) : (
          <Box flex={1} justify="center" align="center">
            <Typography variant="h2" color="text.primary" weight="bold" center mb="sm">
              아직 기록된 직관이 없어요
            </Typography>
            <Typography variant="body2" color="text.secondary" center mb="md">
              첫 직관 일기를 작성하고{"\n"}캘린더를 채워보세요!
            </Typography>
          </Box>
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
    paddingBottom: theme.spacing.SCREEN * 2,
  },
  cardContainer: {
    marginBottom: theme.spacing.COMPONENT,
  },
  thumbnailList: {
    marginBottom: theme.spacing.sm,
  },
  thumbnailContent: {
    paddingRight: theme.spacing.sm,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: theme.radius.md,
    marginRight: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  contentsText: {
    lineHeight: 20,
  },
});
