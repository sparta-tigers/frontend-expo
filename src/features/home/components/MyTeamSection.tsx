import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { theme } from "@/src/styles/theme";
import { TeamDto, MiniStatDto } from "../types";
import { styles } from "../styles";

/**
 * 마이팀 요약 섹션
 *
 * Why: 홈 화면 최상단에서 사용자의 닉네임, 활동 일수, 응원팀 정보 및 주요 통계(직관 횟수 등)를 요약해서 보여주기 위함.
 * @param props.userNickname 사용자 닉네임
 * @param props.daysInSchool 서비스 이용 일수
 * @param props.myTeam 응원팀 정보 (TeamDto)
 * @param props.stats 표시할 미니 통계 배열 (MiniStatDto[])
 * @param props.onPressChangeTeam 팀 변경 버튼 클릭 시 콜백
 */
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

/**
 * 미니 통계 카드 컴포넌트 (내부용)
 *
 * Why: MyTeamSection 내에서 개별 통계 항목(직관 횟수, 알람 등)을 카드 형태로 일관되게 렌더링하기 위함.
 * @param props.item 표시할 통계 데이터 (MiniStatDto)
 */
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
            name={item.iconName}
            color={iconColor}
          />
        </View>
      </View>
      <Text style={styles.miniStatValue}>{item.valueText}</Text>
      <Text style={styles.miniStatLabel}>{item.label}</Text>
    </View>
  );
}
