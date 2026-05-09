import React from "react";
import { Box, Typography } from "@/components/ui";
import { LineupRowDto } from "../types";
import { theme } from "@/src/styles/theme";
import { getTeamColorPath } from "@/src/utils/team";
import { StyleSheet } from "react-native";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  rowWidth: theme.layout.dashboard.lineupRowWidth,
  rowHeight: theme.layout.dashboard.lineupRowHeight,
  numberAreaLeft: theme.spacing.lg,
  dividerWidth: StyleSheet.hairlineWidth,
  dividerHeight: "80%",
} as const;

interface LineupSectionProps {
  /** 표시할 라인업 데이터 배열 */
  lineup: LineupRowDto[];
  /** 사용자의 팀명 (색상 주입용) */
  teamName?: string;
}

/**
 * 오늘의 라인업 섹션
 *
 * Why: 홈 화면에서 당일 선발 라인업을 시각적으로 구현. 
 * 데이터가 없을 경우 '미발표' 안내를 표시하며, Zero-Magic UI 원칙에 따라 프리미티브 컴포넌트를 사용함.
 */
export const LineupSection = React.memo(function LineupSection({ lineup, teamName }: LineupSectionProps) {
  const teamColorPath = getTeamColorPath(teamName ?? "");

  // 🚨 Empty State: 라인업 데이터가 없는 경우 (경기 전)
  if (!lineup || lineup.length === 0) {
    return (
      <Box mt="xxxxl" px="SCREEN_DASHBOARD">
        <Box height={theme.layout.dashboard.sectionTitleHeight} align="center" justify="center" mb="md">
          <Typography variant="h3" weight="bold" center>
            오늘의 라인업을 기다리고 있어요
          </Typography>
        </Box>
        <Box 
          width={LOCAL_LAYOUT.rowWidth} 
          height={LOCAL_LAYOUT.rowHeight * 3} 
          rounded="xl" 
          bg="card" 
          justify="center" 
          align="center"
          style={styles.rowShadow}
        >
          <Typography variant="h3" color="text.secondary" center>
            아직 라인업이 발표되지 않았습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" center mt="xs">
            경기가 시작되면 실시간으로 업데이트돼요!
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box mt="xxxxl" px="SCREEN_DASHBOARD">
      <Box height={theme.layout.dashboard.sectionTitleHeight} align="center" justify="center" mb="md">
        <Typography variant="h3" weight="bold" center>
          오늘, 승리를 이끌 라인업이에요
        </Typography>
      </Box>

      <Box align="center" gap="xs">
        {lineup.map((row) => (
          <Box 
            key={`${row.battingOrder}-${row.name}`} 
            width={LOCAL_LAYOUT.rowWidth} 
            height={LOCAL_LAYOUT.rowHeight} 
            rounded="full" 
            bg="card" 
            justify="center"
            style={styles.rowShadow}
            accessibilityLabel={`${row.battingOrder}번 타자 ${row.name} ${row.position}`}
          >
            <Box 
              position="absolute" 
              left={LOCAL_LAYOUT.numberAreaLeft} 
              top={0} 
              bottom={0} 
              flexDir="row" 
              align="center" 
              gap="lg"
            >
              <Box width={theme.spacing.lg} align="center">
                <Typography 
                  variant="h2" 
                  weight="bold" 
                  color={teamColorPath}
                >
                  {row.battingOrder}
                </Typography>
              </Box>
              <Box 
                width={LOCAL_LAYOUT.dividerWidth} 
                height={LOCAL_LAYOUT.dividerHeight} 
                bg="team.neutralLight" 
              />
            </Box>

            <Typography variant="h3" weight="bold" center color="primary">
              {row.name}
            </Typography>

            <Box position="absolute" right={theme.spacing.lg}>
              <Typography 
                variant="h3" 
                weight="bold" 
                color={teamColorPath}
              >
                {row.position}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  rowShadow: {
    ...theme.shadow.card,
  },
});
