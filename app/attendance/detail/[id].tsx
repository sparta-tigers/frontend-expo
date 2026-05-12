import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useAttendance, useDeleteAttendance } from "@/src/features/match-attendance/queries";
import { theme } from "@/src/styles/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { TEAM_DATA, isValidTeamCode } from "@/src/utils/team";
import { favoriteTeamGetAPI } from "@/src/features/user/favorite-team-api";
import { FavoriteTeam } from "@/src/features/user/favorite-team";
import { calculateMatchResult } from "@/src/utils/match";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * 🚨 [Phase 24] 직관 기록 상세 조회 화면 (개선 버전)
 * 
 * Why: 사용자가 기록한 직관 일기를 감상하고 관리(수정/삭제)함.
 * Zero-Magic: 전역 헤더와의 중복을 피하고, 팀 마스코트 및 컬러를 활용해 몰입감을 높임.
 */
export default function AttendanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: attendance, isLoading } = useAttendance(Number(id));
  const deleteMutation = useDeleteAttendance();
  const [favoriteTeam, setFavoriteTeam] = useState<FavoriteTeam | null>(null);

  useEffect(() => {
    favoriteTeamGetAPI().then(res => {
      if (res.resultType === "SUCCESS") setFavoriteTeam(res.data);
    });
  }, []);

  const handleDelete = () => {
    Alert.alert("삭제 확인", "이 직관 기록을 정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { 
        text: "삭제", 
        style: "destructive", 
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(Number(id));
            router.replace("/(tabs)/history");
          } catch {
            Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
          }
        } 
      }
    ]);
  };

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
    return calculateMatchResult(
      attendance.homeScore,
      attendance.awayScore,
      attendance.homeTeamCode,
      attendance.awayTeamCode,
      favoriteTeam?.teamCode
    );
  };

  const result = getMatchResult();
  const homeTeam = isValidTeamCode(attendance.homeTeamCode) ? TEAM_DATA[attendance.homeTeamCode] : null;
  const awayTeam = isValidTeamCode(attendance.awayTeamCode) ? TEAM_DATA[attendance.awayTeamCode] : null;

  return (
    <SafeLayout style={styles.safeLayout}>
      {/* 🚨 상단 헤더 중복 제거: expo-router의 전역 헤더를 사용하되, 
          필요 시 우측 액션(수정/삭제)만 커스텀으로 배치하거나 별도 툴바 활용 */}
      <Box px="SCREEN" py="sm" flexDir="row" justify="flex-end" gap="md">
        <TouchableOpacity onPress={() => router.push(`/attendance/${attendance.matchId}`)}>
          <Ionicons name="create-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
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
              <Box 
                width={64} 
                height={64} 
                bg="surface" 
                rounded="full" 
                align="center" 
                justify="center" 
                mb="xs"
                style={[styles.teamMascotContainer, { borderColor: homeTeam?.color }]}
              >
                <Typography style={styles.mascotEmoji}>{homeTeam?.mascotEmoji ?? "🏠"}</Typography>
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
              <Box 
                width={64} 
                height={64} 
                bg="surface" 
                rounded="full" 
                align="center" 
                justify="center" 
                mb="xs"
                style={[styles.teamMascotContainer, { borderColor: awayTeam?.color }]}
              >
                <Typography style={styles.mascotEmoji}>{awayTeam?.mascotEmoji ?? "🚀"}</Typography>
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
            <MaterialCommunityIcons name="seat-passenger" size={18} color={theme.colors.brand.mint} />
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
              {attendance.contents || "작성된 내용이 없습니다."}
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
  mascotEmoji: {
    fontSize: 32,
  },
  teamMascotContainer: {
    borderWidth: 2,
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
