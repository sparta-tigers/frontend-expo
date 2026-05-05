import React from "react";
import { View, Text } from "react-native";
import { LineupRowDto } from "../types";
import { styles } from "../styles";

/**
 * 오늘의 라인업 섹션
 *
 * Why: 홈 화면에서 당일 선발 라인업(타순, 이름, 포지션)을 목록으로 보여주기 위해 분리.
 * @param props.lineup 표시할 LineupRowDto 배열
 */
export function LineupSection(props: { lineup: LineupRowDto[] }) {
  const { lineup } = props;

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleText}>오늘, 승리를 이끌 라인업이예요</Text>
      </View>

      <View style={styles.lineupList}>
        {lineup.map((row) => (
          <View key={row.order} style={styles.lineupRow} accessibilityLabel={`${row.order}번 타자 ${row.name} ${row.position}`}>
            <View style={styles.lineupNumberArea}>
              <Text style={styles.lineupNumberText}>{row.order}</Text>
              <View style={styles.lineupDivider} />
            </View>
            <Text style={styles.lineupNameText}>{row.name}</Text>
            <Text style={styles.lineupPosText}>{row.position}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
