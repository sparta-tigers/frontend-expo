import { Box, Typography } from "@/components/ui";
import { useTicketAlarms } from "@/src/features/ticket-alarm/hooks/useTicketAlarm";
import { useAuth } from "@/context/AuthContext";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { LeagueType } from "@/src/features/match/types";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";
import { theme } from "@/src/styles/theme";
import { useInfiniteMyAttendances } from "@/src/features/match-attendance/queries";
import { 
  getCurrentMonth,
  getCurrentYear,
  getCurrentDay,
  getRelativeMonth,
} from "@/src/utils/date";
import { findTeamMeta, TeamCode, TeamMeta } from "@/src/utils/team";
import { ThemeColorPath } from "@/src/shared/types/theme";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState, useMemo } from "react";
import { Pressable, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ========================================================
// 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerHeight: 60,
  calendarCellHeight: 80,
  mascotFontSize: 40,
  dropdownWidth: 150,
  dropdownTop: 45,
} as const;

// ========================================================
// [SHARED] 브랜딩 헤더 컴포넌트
// ========================================================
const BrandingHeader = React.memo<{ team: TeamMeta }>(({ team }) => {
  const insets = useSafeAreaInsets();

  return (
    <Box
      style={[styles.brandingHeader, { paddingTop: insets.top }]}
      bg="background"
      px="SCREEN"
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderColor="team.neutralLight"
    >
      <Box
        height={LOCAL_LAYOUT.headerHeight}
        flexDir="row"
        align="center"
        justify="space-between"
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color={theme.colors.brand.subtitle}
          />
        </TouchableOpacity>

        <Box flexDir="row" align="center">
          <Typography variant="h2" weight="bold" color="text.primary" mr="xs">
            {team?.shortName?.toUpperCase() || "KBO"}
          </Typography>
          <Typography
            variant="h2"
            weight="bold"
            color={`team.${team?.colorToken || "fallback"}`}
          >
            {team?.subName?.toUpperCase() || "TEAM"}
          </Typography>
        </Box>

        <Box width={24} />
      </Box>

      <Box align="center" pb="md">
        <Typography variant="h1" style={styles.mascotEmoji}>
          {team?.mascotEmoji || "⚾"}
        </Typography>
      </Box>
    </Box>
  );
});
BrandingHeader.displayName = "BrandingHeader";

/**
 * 경기 일정 화면 (`main_1`)
 *
 * Why: 월간 경기 일정을 캘린더 형태로 제공.
 */
export default function ScheduleScreen() {
  const { myTeam } = useAuth();
  const activeTeamCode = (myTeam as TeamCode) || "KIA";

  // 1. [SSOT] URL 파라미터 기반 상태 관리
  const params = useLocalSearchParams<{
    year?: string;
    month?: string;
    leagueType?: string;
    from?: string;
  }>();
  const year = params.year ? parseInt(params.year) : getCurrentYear();
  const month = params.month ? parseInt(params.month) : getCurrentMonth();
  const leagueType = (params.leagueType as LeagueType) || "REGULAR";
  const from = params.from;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 2. [PERF] 구단 데이터 메모이제이션
  const activeTeam = useMemo(() => findTeamMeta(activeTeamCode), [activeTeamCode]);
  const activeTeamColorPath = useMemo(
    () => `team.${activeTeam?.colorToken || "fallback"}` as ThemeColorPath,
    [activeTeam?.colorToken]
  );

  const today = useMemo(() => ({
    year: getCurrentYear(),
    month: getCurrentMonth(),
    day: getCurrentDay(),
  }), []);

  const {
    data: schedule,
    isLoading,
    isFetching,
  } = useMatchSchedule(year, month, activeTeamCode, leagueType);

  // 2. 직관 기록 데이터 로드 및 맵 생성
  const { data: infiniteAttendances } = useInfiniteMyAttendances(100);
  const attendanceMap = useMemo(() => {
    const map = new Map<number, number>();
    const firstPageContent = infiniteAttendances?.pages[0]?.data?.content ?? [];
    firstPageContent.forEach((a) => map.set(a.matchId, a.id));
    return map;
  }, [infiniteAttendances]);

  const attendanceMatchIds = useMemo(() => {
    return new Set(attendanceMap.keys());
  }, [attendanceMap]);

  // 3. 예매 알림 데이터 로드 및 맵 생성
  const { data: ticketAlarmsRes } = useTicketAlarms(1, 50);
  const ticketAlarmMap = useMemo(() => {
    const map = new Map<number, number>();
    ticketAlarmsRes?.content.forEach((a) => map.set(a.matchId, a.alarmId));
    return map;
  }, [ticketAlarmsRes]);

  const days = useCalendarGrid(year, month, schedule || [], today, undefined, attendanceMatchIds);

  const handleMoveMonth = (offset: number) => {
    const { year: nextYear, month: nextMonth } = getRelativeMonth(
      year,
      month,
      offset,
    );
    router.setParams({
      year: nextYear.toString(),
      month: nextMonth.toString(),
    });
  };

  const handleSelectLeague = (type: LeagueType) => {
    router.setParams({ leagueType: type });
    setIsDropdownOpen(false);
  };

  const leagueLabelMap: Record<LeagueType, string> = {
    PRESEASON: "시범경기",
    REGULAR: "정규리그",
    POST_SEASON: "포스트시즌",
    DREAM: "드림리그",
    NANUM: "나눔리그",
  };

  if (isLoading)
    return (
      <Box flex={1} bg="background">
        <Stack.Screen options={{ headerShown: false }} />
        <BrandingHeader team={activeTeam} />
        <ScheduleSkeleton />
      </Box>
    );

  return (
    <Box flex={1} bg="background">
      <Stack.Screen options={{ headerShown: false }} />

      <BrandingHeader team={activeTeam} />

      {isDropdownOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() => setIsDropdownOpen(false)}
        />
      )}

      <Box style={styles.contentContainer}>
        <Box style={styles.dropdownContainer}>
          <TouchableOpacity
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            activeOpacity={0.7}
            style={[
              styles.leagueSelector,
              {
                borderColor: activeTeam?.color || theme.colors.brand.mint,
              },
            ]}
          >
            <Typography
              variant="caption"
              color={activeTeamColorPath}
              weight="bold"
            >
              {leagueLabelMap[leagueType]} ∨
            </Typography>
          </TouchableOpacity>

          {isDropdownOpen && (
            <Box
              style={styles.dropdownMenu}
              bg="card"
              rounded="md"
              borderWidth={1}
              borderColor="team.neutralLight"
            >
              {(Object.keys(leagueLabelMap) as LeagueType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleSelectLeague(type)}
                  style={styles.dropdownItem}
                >
                  <Typography
                    variant="body2"
                    color={leagueType === type ? "brand.mint" : "text.primary"}
                    weight={leagueType === type ? "bold" : "medium"}
                  >
                    {leagueLabelMap[type]}
                  </Typography>
                </TouchableOpacity>
              ))}
            </Box>
          )}
        </Box>

        <Box flexDir="row" align="center" mb="xl">
          <TouchableOpacity
            onPress={() => handleMoveMonth(-1)}
            style={styles.arrowBtn}
          >
            <MaterialIcons
              name="chevron-left"
              size={32}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>

          <Typography variant="h3" weight="bold" mx="lg">
            {year}년 {month}월
          </Typography>

          <TouchableOpacity
            onPress={() => handleMoveMonth(1)}
            style={styles.arrowBtn}
          >
            <MaterialIcons
              name="chevron-right"
              size={32}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        </Box>

        <Box style={styles.gridContainer} opacity={isFetching ? 0.5 : 1}>
          <Box
            flexDir="row"
            bg="team.neutralLight"
            roundedTop="lg"
            overflow="hidden"
          >
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <Box key={d} flex={1} py="sm" align="center">
                <Typography
                  variant="caption"
                  weight="bold"
                  color={i === 0 || i === 6 ? "brand.mint" : "brand.subtitle"}
                >
                  {d}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            flexDir="row"
            flexWrap="wrap"
            borderWidth={StyleSheet.hairlineWidth}
            borderColor="team.neutralLight"
          >
            {days.map((cell, idx) => {
              const isEmpty = cell.day === 0;
              const cellDate = new Date(year, month - 1, cell.day);
              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);
              const isFuture = cellDate > todayDate;
              const attendanceId = cell.matchId ? attendanceMap.get(cell.matchId) : null;

              return (
                <TouchableOpacity
                  key={`${cell.day}-${idx}`}
                  style={[
                    styles.calendarCell,
                    cell.isToday && { backgroundColor: theme.colors.brand.mintAlpha10 }
                  ]}
                  activeOpacity={0.7}
                  disabled={isEmpty || !cell.hasGame}
                  onPress={() => {
                    if (isFuture) {
                      // 🔔 미래 경기: 예매 알림 페이지로 이동
                      if (cell.matchId) {
                        router.push({
                          pathname: "/ticket-alarm/[matchId]",
                          params: { matchId: cell.matchId, ...(from ? { from } : {}) },
                        });
                      }
                    } else {
                      // 📝 과거 경기: 직관 기록 페이지로 이동
                      if (attendanceId) {
                        router.push(`/attendance/detail/${attendanceId}`);
                      } else if (cell.matchId) {
                        router.push(`/attendance/${cell.matchId}`);
                      }
                    }
                  }}
                >
                  {!isEmpty && (
                    <>
                      {cell.hasAttendance && (
                        <Box style={styles.attendanceStamp}>
                          <Ionicons name="checkmark-done-circle" size={40} color={theme.colors.brand.mintAlpha10} />
                        </Box>
                      )}

                      <Box flexDir="row" justify="space-between" width="100%">
                        <Box flexDir="row" align="center">
                          <Typography
                            variant="caption"
                            color={cell.isToday ? "brand.mint" : "text.secondary"}
                          >
                            {cell.day}
                          </Typography>
                        </Box>
                        {cell.location && (
                          <Box flexDir="row" align="center">
                            {isFuture && cell.matchId !== undefined && ticketAlarmMap.has(cell.matchId) && (
                              <MaterialIcons 
                                name="notifications-active" 
                                size={12} 
                                color={theme.colors.brand.mint} 
                                style={styles.alarmIcon}
                              />
                            )}
                            <Typography
                              variant="caption"
                              weight="bold"
                              color="brand.mint"
                            >
                              {cell.location}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      {cell.hasGame && (
                        <Box flex={1} justify="center" align="center">
                          <Box
                            bg={
                              cell.opponentCode
                                ? `team.${findTeamMeta(cell.opponentCode)?.colorToken || "fallback"}` as ThemeColorPath
                                : "team.neutralLight"
                            }
                            rounded="full"
                            p="xs"
                            mb="xxs"
                          >
                            <Typography style={styles.matchBadgeText}>
                              🏟️
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            style={styles.matchTimeText}
                            weight="bold"
                          >
                            {cell.timeText}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </Box>
        </Box>

        {(year !== today.year || month !== today.month) && (
          <TouchableOpacity
            style={[
              styles.todayBtn,
              { borderColor: activeTeam?.color || theme.colors.brand.mint },
            ]}
            onPress={() =>
              router.setParams({
                year: today.year.toString(),
                month: today.month.toString(),
              })
            }
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="today"
              size={18}
              color={activeTeam?.color || theme.colors.brand.mint}
            />
            <Typography
              variant="caption"
              weight="bold"
              color={activeTeamColorPath}
              ml="xs"
            >
              오늘로 돌아가기
            </Typography>
          </TouchableOpacity>
        )}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  brandingHeader: {
    backgroundColor: theme.colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.SCREEN,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    zIndex: 10,
  },
  calendarCell: {
    width: "14.285%",
    height: LOCAL_LAYOUT.calendarCellHeight,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.team.neutralLight,
    padding: 4,
  },
   mascotEmoji: {
    fontSize: LOCAL_LAYOUT.mascotFontSize,
  },
  leagueSelector: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderWidth: theme.colors.border.width.medium,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
  },
  dropdownContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    zIndex: 10,
  },
  dropdownMenu: {
    position: "absolute",
    top: LOCAL_LAYOUT.dropdownTop,
    width: LOCAL_LAYOUT.dropdownWidth,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.team.neutralLight,
    ...theme.shadow.card,
  },
  dropdownItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.light,
  },
  gridContainer: {
    width: "100%",
  },
  arrowBtn: {
    padding: theme.spacing.md,
  },
  matchBadgeText: {
    fontSize: theme.typography.size.CAPTION,
  },
  matchTimeText: {
    fontSize: theme.typography.size.xxs,
  },
  todayBtn: {
    marginTop: theme.spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  attendanceStamp: {
    position: "absolute",
    top: "15%",
    left: "15%",
    opacity: 0.8,
    zIndex: 1,
  },
  alarmIcon: {
    marginRight: theme.spacing.xxs,
  },
});
