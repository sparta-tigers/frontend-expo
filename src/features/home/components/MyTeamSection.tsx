import { TEAM_DATA } from "@/src/utils/team";
import { theme } from "@/src/styles/theme";
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerLetterSpacing: 1,
  changeTeamPaddingVertical: 4,
  changeTeamPaddingHorizontal: 8,
  cardBorderLeftWidth: 4,
  cardShadowOpacity: 0.05,
  mascotLetterSpacing: -0.5,
} as const;

/**
 * 미니 통계 카드 컴포넌트
 * 
 * Why: 순위, 승률 등 주요 지표를 간결하게 표현하기 위함.
 */
interface MiniStatCardProps {
  item: {
    label: string;
    value: string;
  };
}

const MiniStatCard = memo(({ item }: MiniStatCardProps) => (
  <Box align="center" mr="lg">
    <Typography variant="caption" color="text.secondary" mb="xs">
      {item.label}
    </Typography>
    <Typography weight="semibold">
      {item.value}
    </Typography>
  </Box>
));
MiniStatCard.displayName = "MiniStatCard";

interface MyTeamSectionProps {
  userNickname: string;
  daysInSchool: number;
  myTeamId?: string | null;
  onPressChangeTeam?: () => void;
}

/**
 * 홈 화면 상단 '나의 팀' 섹션
 * 
 * Why: 사용자의 소속감 고취 및 핵심 데이터(순위, 승률 등) 가시성 확보.
 * Zero-Magic UI 원칙을 준수하여 Box와 Typography 프리미티브로 구현됨.
 */
export const MyTeamSection = memo(({
  userNickname,
  daysInSchool,
  myTeamId,
  onPressChangeTeam,
}: MyTeamSectionProps) => {
  // Why: 선택된 팀의 ID를 기반으로 메타데이터 및 테마 컬러 추출.
  const myTeam = (myTeamId && TEAM_DATA[myTeamId]) || TEAM_DATA["KIA"];
  const teamColor = myTeam.color;

  const stats = [
    { key: "rank", label: "순위", value: "3위" },
    { key: "winRate", label: "승률", value: "0.542" },
    { key: "recent", label: "최근", value: "3승 2패" },
  ];

  // 동적 스타일 (응원팀 테마 컬러 반영)
  const dynamicCardStyle = { borderLeftColor: teamColor };
  const dynamicDaysTextStyle = { color: teamColor };
  const dynamicMascotTextStyle = { color: teamColor };

  return (
    <Box mt="xxl" px="SCREEN_DASHBOARD">
      {/* 섹션 헤더 */}
      <Box flexDir="row" justify="space-between" align="center" mb="md">
        <Typography variant="label" color="text.secondary" style={styles.headerLabel}>
          MY TEAM
        </Typography>
        {onPressChangeTeam && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPressChangeTeam}
            style={styles.changeTeamButton}
            accessibilityRole="button"
            accessibilityLabel="응원팀 변경"
          >
            <Typography variant="caption" color="primary" weight="semibold">
              응원팀 변경
            </Typography>
          </TouchableOpacity>
        )}
      </Box>

      {/* 팀 카드 */}
      <Box 
        bg="surface" 
        rounded="lg" 
        p="lg" 
        style={[styles.myTeamCard, dynamicCardStyle]}
      >
        <Box flexDir="row" align="baseline" mb="lg">
          <Typography variant="h3" weight="bold">
            {userNickname}
          </Typography>
          <Typography ml="xxs">님,</Typography>
          <Typography ml="xxs">입학한지 </Typography>
          <Typography 
            variant="h2" 
            weight="black" 
            mx="xxs" 
            style={dynamicDaysTextStyle}
          >
            {daysInSchool}
          </Typography>
          <Typography>일째 !</Typography>
        </Box>

        <Box flexDir="row" justify="space-between" align="flex-end">
          <Box flexDir="row">
            {stats.map((item) => (
              <MiniStatCard key={item.key} item={item} />
            ))}
          </Box>

          <Box align="center">
            <Typography variant="h3" mb="xxs">
              {myTeam.mascotEmoji}
            </Typography>
            <Typography 
              variant="caption" 
              weight="bold" 
              style={[styles.mascotTeamText, dynamicMascotTextStyle]}
            >
              {myTeam.shortName}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});
MyTeamSection.displayName = "MyTeamSection";

const styles = StyleSheet.create({
  headerLabel: {
    letterSpacing: LOCAL_LAYOUT.headerLetterSpacing,
  },
  changeTeamButton: {
    paddingVertical: LOCAL_LAYOUT.changeTeamPaddingVertical,
    paddingHorizontal: LOCAL_LAYOUT.changeTeamPaddingHorizontal,
  },
  myTeamCard: {
    borderLeftWidth: LOCAL_LAYOUT.cardBorderLeftWidth,
    ...theme.shadow.card,
    shadowOpacity: LOCAL_LAYOUT.cardShadowOpacity,
  },
  mascotTeamText: {
    letterSpacing: LOCAL_LAYOUT.mascotLetterSpacing,
  },
});
