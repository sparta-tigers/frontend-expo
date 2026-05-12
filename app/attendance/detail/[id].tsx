import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import {
    useAttendance,
    useDeleteAttendance,
} from "@/src/features/match-attendance/queries";
import { FavoriteTeam } from "@/src/features/user/favorite-team";
import { favoriteTeamGetAPI } from "@/src/features/user/favorite-team-api";
import { theme } from "@/src/styles/theme";
import { calculateMatchResult } from "@/src/utils/match";
import { TEAM_DATA, isValidTeamCode } from "@/src/utils/team";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

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
    // [Phase 2-1] 라우트 파라미터 유효성 검사 (useEffect 내부)
    const idNumber = Number(id);
    if (!id || isNaN(idNumber)) {
      return;
    }

    favoriteTeamGetAPI().then((res) => {
      if (res.resultType === "SUCCESS") setFavoriteTeam(res.data);
    });
  }, [id]);

  // [Phase 2-1] 라우트 파라미터 유효성 검사 (Fail-fast)
  const idNumber = Number(id);
  if (!id || isNaN(idNumber)) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center" p="SCREEN">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Typography
            variant="h3"
            color="text.primary"
            weight="bold"
            center
            mt="md"
          >
            유효하지 않은 기록 ID
          </Typography>
          <Typography variant="body2" color="text.secondary" center mt="sm">
            기록 정보를 불러올 수 없습니다.
          </Typography>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/history")}
          >
            <Typography variant="body1" color="background" weight="bold">
              이전 화면으로
            </Typography>
          </TouchableOpacity>
        </Box>
      </SafeLayout>
    );
  }

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
        },
      },
    ]);
  };

  // 🚨 [Phase 2-2] 무한 로딩 UI 방어
  // isLoading이 true일 때만 로딩 UI 표시
  // attendance가 null이고 isLoading이 false일 때는 에러 UI 표시
  if (isLoading) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center">
          <ActivityIndicator color={theme.colors.brand.mint} />
        </Box>
      </SafeLayout>
    );
  }

  if (!attendance) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <Box flex={1} justify="center" align="center" p="SCREEN">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Typography
            variant="h3"
            color="text.primary"
            weight="bold"
            center
            mt="md"
          >
            기록을 찾을 수 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary" center mt="sm">
            해당 기록이 삭제되었거나 존재하지 않습니다.
          </Typography>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/history")}
          >
            <Typography variant="body1" color="background" weight="bold">
              이전 화면으로
            </Typography>
          </TouchableOpacity>
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
      favoriteTeam?.teamCode,
    );
  };

  const result = getMatchResult();
  const homeTeam = isValidTeamCode(attendance.homeTeamCode)
    ? TEAM_DATA[attendance.homeTeamCode]
    : null;
  const awayTeam = isValidTeamCode(attendance.awayTeamCode)
    ? TEAM_DATA[attendance.awayTeamCode]
    : null;

  return (
    <SafeLayout style={styles.safeLayout}>
      {/* 🚨 상단 헤더 중복 제거: expo-router의 전역 헤더를 사용하되, 
          필요 시 우측 액션(수정/삭제)만 커스텀으로 배치하거나 별도 툴바 활용 */}
      <Box px="SCREEN" py="sm" flexDir="row" justify="flex-end" gap="md">
        <TouchableOpacity
          onPress={() => router.push(`/attendance/${attendance.matchId}`)}
        >
          <Ionicons
            name="create-outline"
            size={24}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
      </Box>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                style={[
                  styles.teamMascotContainer,
                  { borderColor: homeTeam?.color ?? theme.colors.border.light },
                ]}
              >
                <Typography style={styles.mascotEmoji}>
                  {homeTeam?.mascotEmoji ?? "🏠"}
                </Typography>
              </Box>
              <Typography variant="body2" weight="bold">
                {attendance.homeTeamName}
              </Typography>
            </Box>

            <Box px="md" align="center">
              <Typography variant="h1" weight="black" color="text.primary">
                {attendance.homeScore} : {attendance.awayScore}
              </Typography>
              <Box
                bg="brand.mintAlpha10"
                px="sm"
                py="xxs"
                rounded="full"
                mt="xs"
              >
                <Typography variant="caption" color="brand.mint" weight="bold">
                  VS
                </Typography>
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
                style={[
                  styles.teamMascotContainer,
                  { borderColor: awayTeam?.color ?? theme.colors.border.light },
                ]}
              >
                <Typography style={styles.mascotEmoji}>
                  {awayTeam?.mascotEmoji ?? "🚀"}
                </Typography>
              </Box>
              <Typography variant="body2" weight="bold">
                {attendance.awayTeamName}
              </Typography>
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
              <Typography variant="h4" color={result.color} weight="bold">
                {result.emoji} {result.text}
              </Typography>
            </Box>
          )}

          <Box flexDir="row" align="center" justify="center">
            <MaterialCommunityIcons
              name="seat-passenger"
              size={18}
              color={theme.colors.brand.mint}
            />
            <Typography variant="body2" weight="semibold" ml="xs">
              {attendance.seat}
            </Typography>
          </Box>
        </Box>

        {/* Gallery */}
        {attendance.images && attendance.images.length > 0 && (
          <Box mb="SCREEN">
            <Typography
              variant="label"
              color="text.secondary"
              mx="SCREEN"
              mb="sm"
            >
              GALLERY
            </Typography>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContent}
            >
              {attendance.images.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: img.imageUrl }}
                  style={styles.galleryImage}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </Box>
        )}

        {/* Memo */}
        <Box px="SCREEN" mb="SCREEN">
          <Typography variant="label" color="text.secondary" mb="sm">
            MEMO
          </Typography>
          <Box bg="card" p="lg" rounded="lg" style={theme.shadow.card}>
            <Typography
              variant="body2"
              color="text.primary"
              style={styles.memoText}
            >
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
    borderWidth: theme.colors.border.width.bold,
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
  backButton: {
    backgroundColor: theme.colors.brand.mint,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.lg,
  },
});
