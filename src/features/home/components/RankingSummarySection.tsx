import { router } from "expo-router";
import React from "react";
import { TextStyle, TouchableOpacity, ViewStyle } from "react-native";

import { Box, Typography } from "@/components/ui";
import { RankingRowDto } from "@/src/features/match/types";
import { theme } from "@/src/styles/theme";
import { TEAM_DATA, TeamCode } from "@/src/utils/team";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  rankWidth: theme.spacing.xxl,
  pillHeight: theme.layout.dashboard.rankingRowHeight,
  pillHeightActive: theme.layout.dashboard.rankingRowHeightActive,
  badgeSize: theme.spacing.xxl,
  /** 가중치 그리드 시스템: 총합 10.5 */
  flexWeights: {
    team: 5.5,
    stat: 1,
    winRate: 1.5,
  },
} as const;

interface RankingSummarySectionProps {
  /** 표시할 KBO 리그 순위 데이터 배열 */
  ranking: RankingRowDto[];
  /** 현재 응원팀 코드 */
  myTeamCode: TeamCode | null;
}

/**
 * 순위 요약 섹션
 *
 * Why: 홈 화면 상단에서 KBO 리그의 전반적인 순위 흐름과 내 응원팀의 현재 위치를 한눈에 파악하기 위함.
 * 가중치 그리드(4.5:1:1:1:1:2)를 적용하여 모든 기기에서 승률 가독성과 열 정렬을 보장함.
 */
export const RankingSummarySection = React.memo(function RankingSummarySection({
  ranking,
  myTeamCode,
}: RankingSummarySectionProps) {
  const myTeamRank = ranking.find((r) => r.teamCode === myTeamCode)?.rank;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/ranking")}
    >
      <Box mt="xxxxl" px="xxxl">
        <Typography variant="h3" weight="bold" center mb="md">
          {myTeamRank
            ? `오늘의 우리 팀 순위는 ${myTeamRank}위예요`
            : "KBO 리그 순위를 확인해보세요"}
        </Typography>

        {/* 🚨 가중치 그리드 헤더 */}
        <RankingHeader />

        <Box gap="sm">
          {ranking.map((row) => (
            <RankingRow
              key={row.teamCode}
              row={row}
              isMyTeam={row.teamCode === myTeamCode}
            />
          ))}
        </Box>
      </Box>
    </TouchableOpacity>
  );
});

/**
 * 순위 테이블 헤더
 * Why: 데이터 행과 동일한 가중치 시스템을 적용하여 수직 열 정렬을 완성함.
 */
const RankingHeader = React.memo(function RankingHeader() {
  return (
    <Box flexDir="row" align="center" gap="sm" mb="xs">
      {/* Rank Spacer */}
      <Box width={LOCAL_LAYOUT.rankWidth} />

      <Box flex={1} px="lg" flexDir="row" align="center">
        {/* Team Area Placeholder (Flex 5) */}
        <Box flex={LOCAL_LAYOUT.flexWeights.team} />

        {/* Stat Labels (Flex 1, 1, 1, 1, 1.5) */}
        {["경기", "승", "패", "무"].map((label) => (
          <Box key={label} flex={LOCAL_LAYOUT.flexWeights.stat} align="center">
            <Typography
              variant="caption"
              weight="bold"
              color="text.tertiary"
              style={styles.headerText}
            >
              {label}
            </Typography>
          </Box>
        ))}
        {/* WinRate Labels */}
        <Box flex={LOCAL_LAYOUT.flexWeights.winRate} align="center">
          <Typography
            variant="caption"
            weight="bold"
            color="text.tertiary"
            style={styles.headerText}
          >
            승률
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

interface RankingRowProps {
  row: RankingRowDto;
  isMyTeam: boolean;
}

/**
 * 순위 행 (내부용)
 *
 * Weighted Grid: Team(4.5) : Stats(1)*4 : WinRate(2) = Total 10.5
 */
const RankingRow = React.memo(function RankingRow({
  row,
  isMyTeam,
}: RankingRowProps) {
  const teamInfo = TEAM_DATA[row.teamCode as TeamCode];

  return (
    <Box
      flexDir="row"
      align="center"
      gap="sm"
      accessibilityLabel={`${row.rank}위 ${row.teamName}`}
    >
      {/* Rank Column */}
      <Box width={LOCAL_LAYOUT.rankWidth} align="center">
        <Typography
          variant={isMyTeam ? "h2" : "h3"}
          weight="bold"
          color={isMyTeam ? "brand.mint" : "text.secondary"}
        >
          {row.rank}
        </Typography>
      </Box>

      {/* Weighted Grid Pill */}
      <Box
        flex={1}
        height={
          isMyTeam ? LOCAL_LAYOUT.pillHeightActive : LOCAL_LAYOUT.pillHeight
        }
        bg={isMyTeam ? "card" : "surface"}
        rounded="full"
        px="lg"
        flexDir="row"
        align="center"
        style={[
          styles.pillCommon,
          isMyTeam ? styles.pillShadow : styles.pillInactiveBorder,
          isMyTeam && styles.pillActiveBorder
        ]}
      >
        {/* Team Area (Flex 4.5) */}
        <Box
          flex={LOCAL_LAYOUT.flexWeights.team}
          flexDir="row"
          align="center"
          gap="xs"
          style={styles.teamArea}
        >
          <Box
            width={LOCAL_LAYOUT.badgeSize}
            height={LOCAL_LAYOUT.badgeSize}
            rounded="full"
            bg="surface"
            align="center"
            justify="center"
          >
            <Typography style={styles.teamEmoji}>
              {teamInfo?.mascotEmoji || "⚾"}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            weight="bold"
            color={isMyTeam ? "brand.mint" : "primary"}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.teamName}
          >
            {teamInfo?.name || row.teamName}
          </Typography>
          {isMyTeam && (
            <Box bg="brand.mint" px="xxs" rounded="sm" style={styles.myBadge}>
              <Typography variant="caption" weight="bold" color="card">
                MY
              </Typography>
            </Box>
          )}
        </Box>

        {/* Regular Stats (Flex 1) */}
        {[row.matchCount, row.winCount, row.loseCount, row.drawCount].map(
          (stat, i) => (
            <Box key={i} flex={LOCAL_LAYOUT.flexWeights.stat} align="center">
              <Typography
                variant="caption"
                color="text.secondary"
                numberOfLines={1}
                style={styles.statText}
              >
                {stat}
              </Typography>
            </Box>
          ),
        )}

        {/* Win Rate (Flex 2) */}
        <Box flex={LOCAL_LAYOUT.flexWeights.winRate} align="center">
          <Typography
            variant="caption"
            color="text.secondary"
            numberOfLines={1}
            style={styles.statText}
          >
            {row.winRate.toFixed(3)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

const styles = {
  pillCommon: {
    borderWidth: 1,
    borderColor: "transparent",
  } as ViewStyle,
  pillShadow: {
    ...theme.shadow.card,
  } as ViewStyle,
  pillActiveBorder: {
    borderWidth: theme.layout.dashboard.rankingMyTeamBorderWidth,
    borderColor: theme.colors.brand.mint,
  } as ViewStyle,
  pillInactiveBorder: {
    borderColor: theme.colors.border.medium,
  } as ViewStyle,
  teamEmoji: {
    fontSize: 14,
  } as TextStyle,
  teamArea: {
    overflow: "hidden",
  } as ViewStyle,
  teamName: {
    flexShrink: 1,
  } as TextStyle,
  myBadge: {
    flexShrink: 0,
  } as ViewStyle,
  statText: {
    textAlign: "center",
  } as TextStyle,
  headerText: {
    fontSize: 10,
    textAlign: "center",
  } as TextStyle,
};
