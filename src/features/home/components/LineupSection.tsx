import { Box, Typography } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { theme } from "@/src/styles/theme";
import { TeamMeta } from "@/src/utils/team";
import { ThemeColorPath } from "@/src/shared/types/theme";
import React from "react";
import { StyleSheet } from "react-native";
import { LineupRowDto } from "../types/dashboard";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  rowWidth: theme.layout.dashboard.lineupRowWidth,
  rowHeight: theme.layout.dashboard.lineupRowHeight,
  numberAreaLeft: theme.spacing.lg,
  dividerWidth: StyleSheet.hairlineWidth,
  dividerHeight: "80%",
  /** Empty State 아이콘 박스 크기 (64px) */
  emptyIconBoxSize: theme.spacing.lg * 4,
  /** Empty State 아이콘 크기 (32px) */
  emptyIconSize: theme.spacing.lg * 2,
} as const;

interface LineupSectionProps {
  /** 표시할 라인업 데이터 배열 */
  lineup: LineupRowDto[];
  /** 구단 메타데이터 (SSOT) */
  teamMeta: TeamMeta | null;
}

/**
 * 오늘의 라인업 섹션
 *
 * Why: 홈 화면에서 당일 선발 라인업을 시각적으로 구현.
 * 데이터가 없을 경우 프리미엄 Empty State를 표시하여 UX를 개선함.
 */
export const LineupSection = React.memo(function LineupSection({
  lineup,
  teamMeta,
}: LineupSectionProps) {
  const teamColorPath = `team.${teamMeta?.colorToken || "fallback"}` as ThemeColorPath;

  // 🚨 Empty State: 라인업 데이터가 없는 경우 (경기 전)
  if (!lineup || lineup.length === 0) {
    return (
      <Box mt="xxxxl" px="SCREEN_DASHBOARD">
        <Box
          height={theme.layout.dashboard.sectionTitleHeight}
          align="center"
          justify="center"
          mb="md"
        >
          <Typography variant="h3" weight="bold" center>
            오늘의 라인업을 기다리고 있어요
          </Typography>
        </Box>

        <Box
          width={LOCAL_LAYOUT.rowWidth}
          rounded="xl"
          bg="card"
          py="xxxl"
          align="center"
          style={[styles.rowShadow, styles.emptyContainer]}
        >
          <Box
            width={LOCAL_LAYOUT.emptyIconBoxSize}
            height={LOCAL_LAYOUT.emptyIconBoxSize}
            rounded="full"
            bg="surface"
            align="center"
            justify="center"
            mb="lg"
          >
            <IconSymbol
              name="person.3.fill"
              size={LOCAL_LAYOUT.emptyIconSize}
              color={theme.colors.brand.mint}
            />
          </Box>

          <Typography variant="h3" weight="bold" color="primary" center>
            라인업을 준비 중이에요
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            center
            mt="xs"
            mx="xl"
          >
            선발 명단이 발표되는 대로{"\n"}가장 먼저 알려드릴게요!
          </Typography>

          {/* 하단에 비어있는 슬롯 실루엣 추가하여 "라인업" 섹션임을 암시 */}
          <Box mt="xxl" width="100%" px="xxl" gap="sm">
            {[1, 2].map((i) => (
              <Box
                key={i}
                height={LOCAL_LAYOUT.rowHeight * 0.8}
                rounded="full"
                bg="surface"
                style={styles.emptySlot}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box mt="xxxxl" px="SCREEN_DASHBOARD">
      <Box
        height={theme.layout.dashboard.sectionTitleHeight}
        align="center"
        justify="center"
        mb="md"
      >
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
                <Typography variant="h2" weight="bold" color={teamColorPath}>
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
              <Typography variant="h3" weight="bold" color={teamColorPath}>
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
  emptyContainer: {
    alignSelf: "center",
  },
  emptySlot: {
    opacity: 0.5,
  },
});
