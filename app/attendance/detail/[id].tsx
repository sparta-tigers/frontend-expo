import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import {
  useAttendance,
  useDeleteAttendance,
} from "@/src/features/match-attendance/queries";
import { useFavoriteTeam } from "@/src/features/user/queries";
import { theme } from "@/src/styles/theme";
import { calculateMatchResult } from "@/src/utils/match";
import { findTeamMeta } from "@/src/utils/team";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AttendanceEmptyState } from "@/src/features/match-attendance/components";
import {
  ActivityIndicator,
  Alert,

  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";



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
  const { data: favoriteTeam, isLoading: isFavLoading } = useFavoriteTeam();

  // [Phase 2-1] 라우트 파라미터 유효성 검사 (Fail-fast)
  const idNumber = Number(id);
  if (!id || isNaN(idNumber)) {
    return (
      <SafeLayout style={styles.safeLayout}>
        <AttendanceEmptyState
          title="유효하지 않은 기록 ID"
          description="기록 정보를 불러오지 못했어요. 다시 시도해주세요."
        />
      </SafeLayout>
    );
  }

  const handleDelete = () => {
    Alert.alert("삭제 확인", "이 직관 기록을 정말 삭제할까요?", [
      { text: "닫기", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(Number(id));
            router.replace("/(tabs)/history");
          } catch {
            Alert.alert("알림", "삭제하지 못했어요.");
          }
        },
      },
    ]);
  };

  // 🚨 [Phase 2-2] 무한 로딩 UI 방어
  // isLoading이 true일 때만 로딩 UI 표시
  // attendance가 null이고 isLoading이 false일 때는 에러 UI 표시
  if (isLoading || isFavLoading) {
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
        <AttendanceEmptyState
          title="기록을 찾지 못했어요"
          description="이미 삭제된 기록이거나 올바른 기록이 아니에요."
        />
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
  const homeTeam = findTeamMeta(attendance.homeTeamCode);
  const awayTeam = findTeamMeta(attendance.awayTeamCode);

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
          {result ? (
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
          ) : null}

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
        {attendance.images && attendance.images.length > 0 ? (
          <Box mb="SCREEN" px="SCREEN">
            <Typography variant="label" color="text.secondary" mb="sm">
              GALLERY
            </Typography>
            <Box style={{ gap: theme.spacing.sm }}>
              {attendance.images.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: img.imageUrl }}
                  style={[styles.galleryImage, styles.fullWidthImage]}
                  contentFit="cover"
                />
              ))}
            </Box>
          </Box>
        ) : null}

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
              {attendance.contents || "아직 작성된 내용이 없어요."}
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
  galleryImage: {
    borderRadius: theme.radius.lg,
  },
  fullWidthImage: {
    width: "100%",
    aspectRatio: 1,
  },
  memoText: {
    lineHeight: 24,
  },
});
