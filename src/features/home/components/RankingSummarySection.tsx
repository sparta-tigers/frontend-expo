import React from "react";
import { View, Text } from "react-native";
import { RankingRowDto } from "../types";
import { styles } from "../styles";

export const RankingSummarySection = React.memo(function RankingSummarySection(props: { ranking: RankingRowDto[] }) {
  const { ranking } = props;
  const myTeamRank = ranking.find((r) => r.isMyTeam)?.rank ?? 0;

  return (
    <View style={styles.section}>
      <Text style={styles.centerTitleText}>
        오늘의 우리 팀 순위는 {myTeamRank}위예요
      </Text>

      <View style={styles.rankingList}>
        {ranking.map((row) => (
          <RankingRow key={row.team.name} row={row} />
        ))}
      </View>
    </View>
  );
});

const RankingRow = React.memo(function RankingRow(props: { row: RankingRowDto }) {
  const { row } = props;
  const isMyTeam = row.isMyTeam === true;

  return (
    <View style={styles.rankingRowWrap} accessibilityLabel={`${row.rank}위 ${row.team.name}`}>
      <Text style={[styles.rankingRankText, isMyTeam && styles.rankingRankMyTeam]}>
        {row.rank}
      </Text>

      <View style={[styles.rankingPill, isMyTeam && styles.rankingPillMyTeam]}>
        <View style={styles.rankingTeamArea}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>{row.team.shortName}</Text>
          </View>
          <Text style={[styles.rankingTeamName, isMyTeam && styles.rankingTeamNameMyTeam]}>
            {row.team.name}
          </Text>
        </View>

        <View style={styles.rankingStatArea}>
          <Text style={styles.rankingStatText}>{row.games}</Text>
          <Text style={styles.rankingStatText}>{row.win}</Text>
          <Text style={styles.rankingStatText}>{row.lose}</Text>
          <Text style={styles.rankingStatText}>{row.draw}</Text>
          <Text style={styles.rankingStatText}>{row.winRate.toFixed(3)}</Text>
        </View>
      </View>
    </View>
  );
});
