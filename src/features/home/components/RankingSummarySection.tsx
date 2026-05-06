import React from "react";
import { Box, Typography } from "@/components/ui";
import { RankingRowDto } from "../types";
import { theme } from "@/src/styles/theme";
import { StyleSheet } from "react-native";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  rankWidth: theme.spacing.xxl,
  pillHeight: theme.layout.dashboard.rankingRowHeight,
  pillHeightActive: theme.layout.dashboard.rankingRowHeightActive,
  teamAreaWidth: theme.layout.dashboard.myTeamMiniCardSize * 2,
  badgeSize: theme.spacing.xxl,
  statTextWidth: theme.spacing.xxl,
} as const;

interface RankingSummarySectionProps {
  /** 표시할 KBO 리그 순위 데이터 배열 */
  ranking: RankingRowDto[];
}

/**
 * 순위 요약 섹션
 *
 * Why: 홈 화면 상단에서 KBO 리그의 전반적인 순위 흐름과 내 응원팀의 현재 위치를 한눈에 파악하기 위함.
 * Zero-Magic UI 원칙에 따라 Box와 Typography 프리미티브를 사용함.
 */
export const RankingSummarySection = React.memo(function RankingSummarySection({ ranking }: RankingSummarySectionProps) {
  const myTeamRank = ranking.find((r) => r.isMyTeam)?.rank ?? 0;

  return (
    <Box mt="xl" px="xxxl">
      <Typography variant="h3" weight="bold" center mb="md">
        오늘의 우리 팀 순위는 {myTeamRank}위예요
      </Typography>

      <Box gap="sm">
        {ranking.map((row) => (
          <RankingRow key={row.team.name} row={row} />
        ))}
      </Box>
    </Box>
  );
});

interface RankingRowProps {
  row: RankingRowDto;
}

/**
 * 순위 행 (내부용)
 */
const RankingRow = React.memo(function RankingRow({ row }: RankingRowProps) {
  const isMyTeam = !!row.isMyTeam;

  return (
    <Box 
      flexDir="row" 
      align="center" 
      gap="sm" 
      accessibilityLabel={`${row.rank}위 ${row.team.name}`}
    >
      <Box width={LOCAL_LAYOUT.rankWidth} align="center">
        <Typography 
          variant={isMyTeam ? "h2" : "h3"} 
          weight="bold" 
          color={isMyTeam ? "brand.mint" : "text.secondary"}
        >
          {row.rank}
        </Typography>
      </Box>

      <Box 
        flex={1} 
        height={isMyTeam ? LOCAL_LAYOUT.pillHeightActive : LOCAL_LAYOUT.pillHeight} 
        bg="card" 
        rounded="full" 
        px="lg" 
        flexDir="row" 
        align="center" 
        justify="space-between" 
        style={[
          styles.pillShadow,
          isMyTeam && styles.pillActiveBorder
        ]}
      >
        <Box flexDir="row" align="center" gap="sm" width={LOCAL_LAYOUT.teamAreaWidth}>
          <Box 
            width={LOCAL_LAYOUT.badgeSize} 
            height={LOCAL_LAYOUT.badgeSize} 
            rounded="full" 
            bg="surface" 
            align="center" 
            justify="center"
          >
            <Typography variant="caption" weight="bold" color="text.secondary">
              {row.team.shortName}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            weight="bold" 
            color={isMyTeam ? "brand.mint" : "primary"}
          >
            {row.team.name}
          </Typography>
        </Box>

        <Box flexDir="row" align="center" gap="sm">
          {[row.games, row.win, row.lose, row.draw, row.winRate.toFixed(3)].map((stat, i) => (
            <Box key={i} width={LOCAL_LAYOUT.statTextWidth} align="center">
              <Typography variant="caption" color="text.secondary">
                {stat}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  pillShadow: {
    ...theme.shadow.card,
  },
  pillActiveBorder: {
    borderWidth: theme.layout.dashboard.rankingMyTeamBorderWidth,
    borderColor: theme.colors.brand.mint,
  },
});
