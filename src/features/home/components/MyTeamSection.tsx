import { Box, Typography } from "@/components/ui";
import { ThemeColorPath } from "@/src/shared/types/theme";
import { theme } from "@/src/styles/theme";
import { TeamMeta } from "@/src/utils/team";
import { MaterialIcons } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

// ========================================================
// 레이아웃 및 디자인 토큰 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerLetterSpacing: 1,
  cardBorderLeftWidth: 4,
  mascotSize: 74,
  statIconSize: 18,
  statItemBorderRadius: 16,
  cardShadow: {
    ...theme.shadow.card,
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statSafetyPadding: 60,
  mascotRightOffset: 0,
} as const;

// ========================================================
// 내부 컴포넌트: StatSummaryItem
// ========================================================
interface StatSummaryItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  toneColor: ThemeColorPath;
  iconColor: string;
}

const StatSummaryItem = memo(
  ({ icon, value, label, toneColor, iconColor }: StatSummaryItemProps) => (
    <Box flex={1} rounded="lg" p="xs" bg={toneColor} style={styles.statItem}>
      <Box
        bg="card"
        width={24}
        height={24}
        rounded="full"
        align="center"
        justify="center"
        mb="xs"
        style={theme.shadow.card}
      >
        <MaterialIcons name={icon} size={14} color={iconColor} />
      </Box>
      <Typography variant="h4" color="text.primary" numberOfLines={1}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        mt="xxs"
        numberOfLines={1}
      >
        {label}
      </Typography>
    </Box>
  ),
);
StatSummaryItem.displayName = "StatSummaryItem";

// ========================================================
// 메인 컴포넌트: MyTeamSection
// ========================================================
interface MyTeamSectionProps {
  userNickname: string;
  enrollmentDays: number;
  remainingMatches: number;
  attendanceCount: number;
  /** 구단 메타데이터 (SSOT) */
  teamMeta: TeamMeta | null;
  onPressChangeTeam?: () => void;
}

/**
 * 홈 화면 상단 '나의 팀' 섹션 (활동 현황 대시보드)
 *
 * Why: 사용자의 소속감 고취 및 핵심 활동 데이터(직관, 알람 등) 가시성 확보.
 * Figma 기획안(image_484459)의 입체적인 레이아웃과 100% 일치하도록 구현.
 */
export const MyTeamSection = memo(
  ({
    userNickname,
    enrollmentDays,
    remainingMatches,
    attendanceCount,
    teamMeta,
    onPressChangeTeam,
  }: MyTeamSectionProps) => {
    const activityStats: {
      key: string;
      icon: keyof typeof MaterialIcons.glyphMap;
      value: string;
      label: string;
      toneColor: ThemeColorPath;
      iconColor: string;
    }[] = [
      {
        key: "visit",
        icon: "bar-chart",
        value: `${attendanceCount}회`,
        label: "올해 직관횟수",
        toneColor: "dashboard.statTonePink",
        iconColor: theme.colors.dashboard.statIconPink,
      },
      {
        key: "alarm",
        icon: "notifications-none",
        value: "2개",
        label: "예매 알람",
        toneColor: "dashboard.statToneYellow",
        iconColor: theme.colors.dashboard.statIconYellow,
      },
      {
        key: "match",
        icon: "star-outline",
        value: `${remainingMatches}경기`,
        label: "남은 경기수",
        toneColor: "dashboard.statToneGreen",
        iconColor: theme.colors.dashboard.statIconGreen,
      },
    ];

    return (
      <Box px="SCREEN_DASHBOARD">
        {/* 섹션 헤더 */}
        <Box flexDir="row" justify="space-between" align="center" mb="md">
          <Typography
            variant="label"
            color="text.secondary"
            style={styles.headerLabel}
          >
            MY TEAM
          </Typography>
          {onPressChangeTeam && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onPressChangeTeam}
              style={styles.changeTeamButton}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                weight="semibold"
              >
                응원팀 변경
              </Typography>
            </TouchableOpacity>
          )}
        </Box>

        {/* 메인 활동 카드 */}
        <Box
          bg="card"
          rounded="xl"
          p="lg"
          borderColor={`team.${teamMeta?.colorToken || "fallback"}` as ThemeColorPath}
          style={styles.myTeamCard}
        >
          {/* 인사말 영역 */}
          <Box
            flexDir="row"
            align="center"
            mb="lg"
            style={styles.greetingContainer}
          >
            <Typography variant="h3" weight="bold">
              {userNickname}
            </Typography>
            <Typography variant="h3" weight="bold" ml="xxs">
              {teamMeta?.mascotEmoji || "⚾"}
            </Typography>
            <Typography variant="caption" color="text.secondary" ml="xxs">
              님, 입학한지
            </Typography>
            <Typography
              variant="h2"
              weight="black"
              mx="xs"
              color="text.primary"
            >
              {enrollmentDays}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              일째 !
            </Typography>
          </Box>

          {/* 스탯 카드 영역 & 마스코트 */}
          <Box flexDir="row" align="center" justify="space-between">
            <Box flex={1} flexDir="row" gap="xs" style={styles.statGrid}>
              {activityStats.map((stat) => (
                <StatSummaryItem
                  key={stat.key}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  toneColor={stat.toneColor}
                  iconColor={stat.iconColor}
                />
              ))}
            </Box>

            {/* 입체적인 마스코트 영역 (Absolute Positioning) */}
            <Box style={styles.mascotContainer}>
              <Typography style={styles.mascotEmoji}>
                {teamMeta?.mascotEmoji || "⚾"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);
MyTeamSection.displayName = "MyTeamSection";

const styles = StyleSheet.create({
  headerLabel: {
    letterSpacing: LOCAL_LAYOUT.headerLetterSpacing,
  },
  changeTeamButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  myTeamCard: {
    borderLeftWidth: LOCAL_LAYOUT.cardBorderLeftWidth,
    overflow: "visible", // 마스코트가 튀어나오게 설정
    ...LOCAL_LAYOUT.cardShadow,
  },
  statItem: {
    // minHeight 제거 및 비율에 따른 유연한 높이 확보
    paddingVertical: 10,
  },
  greetingContainer: {
    flexWrap: "wrap",
  },
  statGrid: {
    paddingRight: LOCAL_LAYOUT.statSafetyPadding,
  },
  mascotContainer: {
    position: "absolute",
    right: LOCAL_LAYOUT.mascotRightOffset,
    bottom: -10,
    width: LOCAL_LAYOUT.mascotSize,
    height: LOCAL_LAYOUT.mascotSize,
    justifyContent: "center",
    alignItems: "center",
  },
  mascotEmoji: {
    fontSize: theme.typography.size.TITLE * 2, // 64px 근사 (28 * 2 = 56, 32 * 2 = 64) - TITLE(28) 기준 보정
    // 그림자 효과로 입체감 부여
    textShadowColor: theme.colors.overlay,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 4,
  },
});
