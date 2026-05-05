import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { theme } from "@/src/styles/theme";
import { TeamDto, MiniStatDto } from "../types";
import { styles } from "../styles";

export function MyTeamSection(props: {
  userNickname: string;
  daysInSchool: number;
  myTeam: TeamDto;
  stats: MiniStatDto[];
  onPressChangeTeam: () => void;
}) {
  const { userNickname, daysInSchool, myTeam, stats, onPressChangeTeam } = props;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderLabel}>MY TEAM</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onPressChangeTeam}
          style={styles.changeTeamButton}
          accessibilityRole="button"
          accessibilityLabel="응원팀 변경"
        >
          <Text style={styles.changeTeamButtonText}>응원팀 변경</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.myTeamCard}>
        <View style={styles.myTeamTitleRow}>
          <Text style={styles.myTeamNicknameText}>{userNickname}</Text>
          <Text style={styles.myTeamSubText}>님,</Text>
          <Text style={styles.myTeamSubText}>입학한지 </Text>
          <Text style={styles.myTeamDaysText}>{daysInSchool}</Text>
          <Text style={styles.myTeamSubText}>일째 !</Text>
        </View>

        <View style={styles.myTeamStatsRow}>
          {stats.map((item) => (
            <MiniStatCard key={item.key} item={item} />
          ))}

          <View style={styles.mascotBox}>
            <Text style={styles.mascotEmoji}>🐯</Text>
            <Text style={styles.mascotTeamText}>{myTeam.shortName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MiniStatCard(props: { item: MiniStatDto }) {
  const { item } = props;
  const toneStyle =
    item.tone === "pink"
      ? styles.miniStatTonePink
      : item.tone === "yellow"
        ? styles.miniStatToneYellow
        : styles.miniStatToneGreen;

  const iconColor =
    item.tone === "pink"
      ? theme.colors.team.kiaRed
      : item.tone === "yellow"
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <View style={[styles.miniStatCard, toneStyle]}>
      <View style={styles.miniStatIconRow}>
        <View style={styles.miniStatIconBadge}>
          <IconSymbol
            size={theme.typography.size.xs}
            name={item.iconName as any}
            color={iconColor}
          />
        </View>
      </View>
      <Text style={styles.miniStatValue}>{item.valueText}</Text>
      <Text style={styles.miniStatLabel}>{item.label}</Text>
    </View>
  );
}
