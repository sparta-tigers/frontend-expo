import React from "react";
import { View, Text } from "react-native";
import { RankingRowDto } from "../types";
import { styles } from "../styles";

/**
 * 순위 요약 섹션의 Props 인터페이스
 *
 * Why: 홈 화면의 데이터 로드 시점과 무관하게 렌더링 안정성을 확보하고, 
 * RankingRowDto 배열의 형태를 명시적으로 규정하여 타입 안정성(Type Safety)을 보장하기 위해 정의함.
 */
interface RankingSummarySectionProps {
  /** 표시할 KBO 리그 순위 데이터 배열 */
  ranking: RankingRowDto[];
}

/**
 * 순위 요약 섹션
 *
 * Why: 홈 화면 상단에서 KBO 리그의 전반적인 순위 흐름과 내 응원팀의 현재 위치를 
 * 한눈에 파악할 수 있는 시각적 요약 정보(Summary)를 제공하기 위한 도메인 컴포넌트임.
 */
export const RankingSummarySection = React.memo(function RankingSummarySection({ ranking }: RankingSummarySectionProps) {
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

/**
 * 순위 행 컴포넌트의 Props 인터페이스
 * 
 * Why: 단일 팀의 순위 데이터를 처리할 때 필요한 최소 단위인 RankingRowDto를 
 * 캡슐화하여, 향후 개별 행에 대한 이벤트 처리나 스타일 확장이 용이하도록 독립된 인터페이스로 분리함.
 */
interface RankingRowProps {
  /** 렌더링할 단일 팀의 순위 및 성적 데이터 */
  row: RankingRowDto;
}

/**
 * 순위 행 (내부용)
 *
 * Why: 리그 순위표의 한 줄을 구성하며, 순위, 팀명, 성적(승/무/패/승률)을 
 * 일관된 테이블 레이아웃으로 렌더링함. 특히 내 응원팀일 경우 시각적 강조(Highlight)를 
 * 적용하여 사용자가 자신의 팀을 즉시 식별할 수 있도록 함.
 */
const RankingRow = React.memo(function RankingRow({ row }: RankingRowProps) {
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
