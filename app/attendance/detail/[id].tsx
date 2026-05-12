import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useAttendance } from "@/src/features/match-attendance/queries";
import { theme } from "@/src/styles/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { getTeamLogo } from "@/src/utils/team";
import { favoriteTeamGetAPI } from "@/src/features/user/favorite-team-api";
import { FavoriteTeam } from "@/src/features/user/favorite-team";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * 🚨 [Phase 24] 직관 기록 상세 조회 화면
 * 
 * Why: 사용자가 기록한 직관 일기를 프리미엄한 레이아웃으로 감상함.
 */
export default function AttendanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: attendance, isLoading } = useAttendance(Number(id));
  const [favoriteTeam, setFavoriteTeam] = useState<FavoriteTeam | null>(null);

  useEffect(() => {
    favoriteTeamGetAPI().then(res => {
      if (res.resultType === "SUCCESS") setFavoriteTeam(res.data);
    });
  }, []);

  if (isLoading || !attendance) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <ActivityIndicator color={theme.colors.brand.mint} />
        </Box>
      </SafeLayout>
    );
  }

  const matchDate = new Date(attendance.matchTime);
  const dateStr = `${matchDate.getFullYear()}년 ${matchDate.getMonth() + 1}월 ${matchDate.getDate()}일`;
  
  // 승무패 결과 계산
  const getMatchResult = () => {
    if (attendance.homeScore === undefined || attendance.awayScore === undefined || !favoriteTeam) return null;
    
    const isHome = attendance.homeTeamCode === favoriteTeam.teamCode;
    const isAway = attendance.awayTeamCode === favoriteTeam.teamCode;
    
    if (!isHome && !isAway) return { text: "경기 종료", color: theme.colors.text.secondary, emoji: "🏟️" };
    
    const myScore = isHome ? attendance.homeScore : attendance.awayScore;
    const opponentScore = isHome ? attendance.awayScore : attendance.homeScore;
    
    if (myScore > opponentScore) return { text: "WIN", color: theme.colors.brand.mint, emoji: "😊" };
    if (myScore < opponentScore) return { text: "LOSE", color: theme.colors.error, emoji: "😭" };
    return { text: "DRAW", color: theme.colors.text.secondary, emoji: "😐" };
  };

  const result = getMatchResult();

  return (
    <SafeLayout style={styles.safeLayout}>
      {/* Header */}
      <Box px="SCREEN" py="md" flexDir="row" align="center" justify="space-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Typography variant="body1" weight="bold">직관 일기</Typography>
        <TouchableOpacity onPress={() => router.push(`/attendance/${attendance.matchId}?edit=true`)}>
          <Typography variant="body2" color="brand.mint" weight="semibold">수정</Typography>
        </TouchableOpacity>
      </Box>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Match Info Card */}
        <Box bg="card" m="SCREEN" p="lg" rounded="xl" style={theme.shadow.card}>
          <Typography variant="caption" color="text.secondary" center mb="sm">
            {dateStr} • {attendance.stadiumName}
          </Typography>

          <Box flexDir="row" align="center" justify="center" mb="lg">
            <Box align="center" flex={1}>
              <Box width={60} height={60} bg="surface" rounded="full" align="center" justify="center" mb="xs">
                {getTeamLogo(attendance.homeTeamCode) ? (
                  <Image source={getTeamLogo(attendance.homeTeamCode)} style={styles.teamLogo} />
                ) : (
                  <Typography variant="h3">🏠</Typography>
                )}
              </Box>
              <Typography variant="body2" weight="bold">{attendance.homeTeamName}</Typography>
            </Box>

            <Box px="md" align="center">
              <Typography variant="h1" weight="black" color="text.primary">
                {attendance.homeScore} : {attendance.awayScore}
              </Typography>
              <Box bg="brand.mintAlpha10" px="sm" py="xxs" rounded="full" mt="xs">
                <Typography variant="caption" color="brand.mint" weight="bold">VS</Typography>
              </Box>
            </Box>

            <Box align="center" flex={1}>
              <Box width={60} height={60} bg="surface" rounded="full" align="center" justify="center" mb="xs">
                {getTeamLogo(attendance.awayTeamCode) ? (
                  <Image source={getTeamLogo(attendance.awayTeamCode)} style={styles.teamLogo} />
                ) : (
                  <Typography variant="h3">🚀</Typography>
                )}
              </Box>
              <Typography variant="body2" weight="bold">{attendance.awayTeamName}</Typography>
            </Box>
          </Box>

          {/* Result Banner */}
          {result && (
            <Box 
              bg="brand.mintAlpha10" 
              p="md" 
              rounded="lg" 
              align="center" 
              mb="md" 
              style={styles.resultBanner}
            >
              <Typography variant="h4" color={result.color as any} weight="bold">
                {result.emoji} {result.text}
              </Typography>
            </Box>
          )}

          <Box flexDir="row" align="center" justify="center">
            <Ionicons name="location" size={16} color={theme.colors.brand.mint} />
            <Typography variant="body2" weight="semibold" ml="xs">{attendance.seat}</Typography>
          </Box>
        </Box>

        {/* Gallery */}
        {attendance.imageUrls && attendance.imageUrls.length > 0 && (
          <Box mb="SCREEN">
            <Typography variant="label" color="text.secondary" mx="SCREEN" mb="sm">GALLERY</Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContent}>
              {attendance.imageUrls.map((url: string, index: number) => (
                <Image key={index} source={{ uri: url }} style={styles.galleryImage} contentFit="cover" />
              ))}
            </ScrollView>
          </Box>
        )}

        {/* Memo */}
        <Box px="SCREEN" mb="SCREEN">
          <Typography variant="label" color="text.secondary" mb="sm">MEMO</Typography>
          <Box bg="card" p="lg" rounded="lg" style={theme.shadow.card}>
            <Typography variant="body2" color="text.primary" style={styles.memoText}>
              {attendance.contents}
            </Typography>
          </Box>
        </Box>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  teamLogo: {
    width: 40,
    height: 40,
  },
  resultBanner: {
    borderColor: theme.colors.brand.mintAlpha10,
    borderWidth: 1,
  },
  galleryContent: {
    paddingHorizontal: theme.spacing.SCREEN,
    gap: theme.spacing.sm,
  },
  galleryImage: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: theme.radius.lg,
  },
  memoText: {
    lineHeight: 24,
  },
});
