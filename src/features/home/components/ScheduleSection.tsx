import { Box, Typography } from "@/components/ui";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";
import { theme } from "@/src/styles/theme";
import { getTeamColorPath } from "@/src/utils/team";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { MatchScheduleDto } from "../../match/types";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  wrapWidth: theme.layout.dashboard.calendarWidth,
  headerHeight: theme.layout.dashboard.calendarHeaderHeight,
  cellWidth: theme.layout.dashboard.calendarCellWidth,
  cellHeight: theme.layout.dashboard.calendarCellHeight,
  calendarRadius: theme.layout.dashboard.calendarRadius,
  borderWidth: StyleSheet.hairlineWidth,
} as const;

interface ScheduleSectionProps {
  schedule: MatchScheduleDto[];
  year: number;
  month: number;
  today?: { year: number; month: number; day: number }; // 🚨 앙드레 카파시: 결정론적 렌더링을 위해 외부에서 주입받음
  attendanceMatchIds?: Set<number>; // 🚨 추가
}

/**
 * 경기 일정 섹션 (캘린더 뷰)
 *
 * Why: 홈 화면 하단에서 월간 경기 일정을 시각적으로 요약하여 제공.
 * Zero-Magic UI 원칙에 따라 모든 수치는 테마 토큰 및 LOCAL_LAYOUT을 참조함.
 */
export const ScheduleSection = React.memo(function ScheduleSection({
  schedule,
  year,
  month,
  today,
  attendanceMatchIds, // 🚨 추가
}: ScheduleSectionProps) {
  const days = useCalendarGrid(year, month, schedule, today, undefined, attendanceMatchIds);

  return (
    <Box mt="xxxxl" pb="xxl" px="SCREEN_DASHBOARD">
      <Box
        height={theme.layout.dashboard.sectionTitleHeight}
        align="center"
        justify="center"
        mb="md"
      >
        <Typography variant="h3" weight="bold" center>
          {month}월, 우리팀 경기 일정이에요
        </Typography>
      </Box>

      <Box width={LOCAL_LAYOUT.wrapWidth} alignSelf="center">
        {/* Calendar Header */}
        <Box
          height={LOCAL_LAYOUT.headerHeight}
          bg="team.neutralLight"
          roundedTop="calendar"
          flexDir="row"
          overflow="hidden"
        >
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <Box key={d} flex={1} align="center" justify="center">
              <Typography
                variant="caption"
                weight="bold"
                color={
                  d === "일" || d === "토" ? "brand.mint" : "brand.subtitle"
                }
              >
                {d}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Grid */}
        <Box
          bg="card"
          roundedBottom="calendar"
          flexDir="row"
          flexWrap="wrap"
          overflow="hidden"
          borderWidth={LOCAL_LAYOUT.borderWidth}
          borderColor="team.neutralLight"
        >
          {days.map((cell, idx) => {
            const isEmpty = cell.day === 0;

            return (
              <TouchableOpacity
                key={`${cell.day}-${idx}`}
                activeOpacity={theme.layout.dashboard.activeOpacity}
                disabled={isEmpty || !cell.hasGame}
                onPress={() =>
                  router.push({
                    pathname: "/schedule",
                    params: {
                      view: "day",
                      day: cell.day.toString(),
                      year: year.toString(),
                      month: month.toString(),
                    },
                  })
                }
                style={[styles.cell, cell.isToday && styles.todayCell]}
                accessibilityRole={isEmpty ? undefined : "button"}
                accessibilityLabel={
                  isEmpty
                    ? undefined
                    : cell.hasGame
                      ? `${cell.day}일 ${cell.opponentShort}전`
                      : `${cell.day}일 경기 없음`
                }
              >
                {!isEmpty && (
                  <>
                    <Box
                      flexDir="row"
                      align="center"
                      justify="space-between"
                      width="100%"
                    >
                      {cell.hasAttendance && (
                        <Box
                          position="absolute"
                          top={2}
                          left="50%"
                          style={styles.attendanceDot}
                          rounded="full"
                          bg="error"
                        />
                      )}
                      <Typography
                        variant="caption"
                        weight={cell.isToday ? "bold" : "medium"}
                        color={cell.isToday ? "brand.mint" : "brand.subtitle"}
                      >
                        {cell.day}
                      </Typography>
                      {cell.location ? (
                        <Typography
                          variant="caption"
                          weight="bold"
                          color="brand.mint"
                        >
                          {cell.location}
                        </Typography>
                      ) : (
                        <Box
                          width={theme.spacing.lg}
                          height={theme.spacing.lg}
                        />
                      )}
                    </Box>

                    {cell.hasGame ? (
                      <Box
                        width={theme.spacing.xxl}
                        height={theme.spacing.xl}
                        rounded="full"
                        // 해결: TEAM_DATA와 연동된 브랜드 컬러를 테마 토큰으로 주입 (No any)
                        bg={
                          cell.opponentCode
                            ? getTeamColorPath(cell.opponentCode)
                            : "surface"
                        }
                        align="center"
                        justify="center"
                        borderWidth={
                          cell.isSelected ? LOCAL_LAYOUT.borderWidth : 0
                        }
                        borderColor={
                          cell.isSelected ? "brand.mint" : "transparent"
                        }
                      >
                        <Typography
                          variant="caption"
                          weight="bold"
                          // 해결: 테마에 정의된 card(#FFFFFF) 토큰을 사용하여 흰색 텍스트 구현
                          color={
                            cell.opponentCode ? "card" : "team.neutralDark"
                          }
                          style={styles.opponentText}
                        >
                          {cell.opponentShort}
                        </Typography>
                      </Box>
                    ) : (
                      <Box height={theme.spacing.xl} />
                    )}

                    {cell.timeText ? (
                      <Typography
                        variant="caption"
                        color="brand.subtitle"
                        style={styles.timeText}
                      >
                        {cell.timeText}
                      </Typography>
                    ) : (
                      <Box height={theme.spacing.md} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  cell: {
    width: LOCAL_LAYOUT.cellWidth,
    height: LOCAL_LAYOUT.cellHeight,
    borderRightWidth: LOCAL_LAYOUT.borderWidth,
    borderBottomWidth: LOCAL_LAYOUT.borderWidth,
    borderColor: theme.colors.team.neutralLight,
    padding: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayCell: {
    borderWidth: theme.layout.dashboard.rankingMyTeamBorderWidth,
    borderColor: theme.colors.brand.mint,
    zIndex: 10, // 보더가 겹칠 때 위로 올라오도록
  },
  opponentText: {
    fontSize: theme.typography.size.xs,
  },
  timeText: {
    fontSize: theme.typography.size.xs,
  },
  attendanceDot: {
    width: 4,
    height: 4,
    marginLeft: -2,
  },
});
