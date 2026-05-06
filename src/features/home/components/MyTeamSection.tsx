import { TEAM_DATA } from "@/src/utils/team";
import { theme } from "@/src/styles/theme";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MiniStatCardProps {
  item: {
    label: string;
    value: string;
  };
}

const MiniStatCard = memo(({ item }: MiniStatCardProps) => (
  <View style={styles.miniStatCard}>
    <Text style={styles.miniStatLabel}>{item.label}</Text>
    <Text style={styles.miniStatValue}>{item.value}</Text>
  </View>
));
MiniStatCard.displayName = "MiniStatCard";

interface MyTeamSectionProps {
  userNickname: string;
  daysInSchool: number;
  myTeamId?: string | null;
  onPressChangeTeam?: () => void;
}

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

  // Dynamic Styles (Must be handled carefully to avoid no-inline-styles)
  // Since teamColor is dynamic, we use a single style object but avoid literals in JSX
  const dynamicCardStyle = { borderLeftColor: teamColor };
  const dynamicDaysTextStyle = { color: teamColor };
  const dynamicMascotTextStyle = { color: teamColor };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderLabel}>MY TEAM</Text>
        {onPressChangeTeam && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPressChangeTeam}
            style={styles.changeTeamButton}
            accessibilityRole="button"
            accessibilityLabel="응원팀 변경"
          >
            <Text style={styles.changeTeamButtonText}>응원팀 변경</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.myTeamCard, dynamicCardStyle]}>
        <View style={styles.myTeamTitleRow}>
          <Text style={styles.myTeamNicknameText}>{userNickname}</Text>
          <Text style={styles.myTeamSubText}>님,</Text>
          <Text style={styles.myTeamSubText}>입학한지 </Text>
          <Text style={[styles.myTeamDaysText, dynamicDaysTextStyle]}>{daysInSchool}</Text>
          <Text style={styles.myTeamSubText}>일째 !</Text>
        </View>

        <View style={styles.myTeamStatsRow}>
          {stats.map((item) => (
            <MiniStatCard key={item.key} item={item} />
          ))}

          <View style={styles.mascotBox}>
            <Text style={styles.mascotEmoji}>{myTeam.mascotEmoji}</Text>
            <Text style={[styles.mascotTeamText, dynamicMascotTextStyle]}>{myTeam.shortName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});
MyTeamSection.displayName = "MyTeamSection";

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: theme.layout.dashboard.screenPaddingHorizontal,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },
  changeTeamButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeTeamButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  myTeamCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: theme.colors.text.primary, // Fixed literal #000
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  myTeamTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  myTeamNicknameText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  myTeamSubText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    marginLeft: 2,
  },
  myTeamDaysText: {
    fontSize: 20,
    fontWeight: "800",
    marginHorizontal: 2,
  },
  myTeamStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  miniStatCard: {
    alignItems: "center",
    marginRight: 16,
  },
  miniStatLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  mascotBox: {
    alignItems: "center",
  },
  mascotEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  mascotTeamText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
