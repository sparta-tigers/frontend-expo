import { Box, Typography } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { LeagueType } from "@/src/features/match/types";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";
import { theme } from "@/src/styles/theme";
import {
  getCurrentMonth,
  getCurrentYear,
  getCurrentDay,
  getRelativeMonth,
} from "@/src/utils/date";
import { TEAM_DATA, TeamCode, getTeamColorPath } from "@/src/utils/team";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ========================================================
// 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerHeight: 60,
  calendarCellHeight: 80,
} as const;

// ========================================================
// [SHARED] 브랜딩 헤더 컴포넌트
// ========================================================
const BrandingHeader: React.FC<{ teamCode: TeamCode }> = ({ teamCode }) => {
  const insets = useSafeAreaInsets();
  const team = TEAM_DATA[teamCode] || TEAM_DATA["KIA"];

  return (
    <Box
      style={{ paddingTop: insets.top }}
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
            {team.shortName.toUpperCase()}
          </Typography>
          <Typography
            variant="h2"
            weight="bold"
            color={getTeamColorPath(teamCode)}
          >
            {team.subName.toUpperCase()}
          </Typography>
        </Box>

        <Box width={24} />
      </Box>

      <Box align="center" pb="md">
        <Typography variant="h1" style={styles.mascotEmoji}>
          {team.mascotEmoji}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * 경기 일정 화면 (`main_1`)
 *
 * Why: 월간 경기 일정을 캘린더 형태로 제공.
 * placeholderData와 isFetching 상태를 결합하여 부드러운 업데이트 경험 제공.
 */
export default function ScheduleScreen() {
  const { myTeam: myTeamId } = useAuth();
  const activeTeamCode = (myTeamId as TeamCode) || "KIA";

  // 1. [SSOT] URL 파라미터 기반 상태 관리
  const params = useLocalSearchParams<{
    year?: string;
    month?: string;
    leagueType?: string;
  }>();
  const year = params.year ? parseInt(params.year) : getCurrentYear();
  const month = params.month ? parseInt(params.month) : getCurrentMonth();
  const leagueType = (params.leagueType as LeagueType) || "REGULAR";

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const today = React.useMemo(() => ({
    year: getCurrentYear(),
    month: getCurrentMonth(),
    day: getCurrentDay(),
  }), []);

  const {
    data: schedule,
    isLoading,
    isFetching,
  } = useMatchSchedule(year, month, activeTeamCode, leagueType);
  const days = useCalendarGrid(year, month, schedule || [], today);

  // 3. 핸들러
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
  };

  if (isLoading)
    return (
      <Box flex={1} bg="background">
        <Stack.Screen options={{ headerShown: false }} />
        <BrandingHeader teamCode={activeTeamCode} />
        <ScheduleSkeleton />
      </Box>
    );

  return (
    <Box flex={1} bg="background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Branded Header */}
      <BrandingHeader teamCode={activeTeamCode} />

      {/* Click-outside Overlay (드롭다운이 열렸을 때만 활성화) 
          Z-index를 활용하여 헤더와 컨텐츠 아래, 하지만 배경 위에 배치 */}
      {isDropdownOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Filter & Calendar Content */}
      <Box style={styles.contentContainer}>
        {/* League Selector & Dropdown Container */}
        <Box style={styles.dropdownContainer}>
          <TouchableOpacity
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            activeOpacity={0.7}
            style={[
              styles.leagueSelector,
              {
                borderColor:
                  theme.colors.team[
                    activeTeamCode.toLowerCase() as keyof typeof theme.colors.team
                  ] || theme.colors.brand.mint,
              },
            ]}
          >
            <Typography
              variant="caption"
              color={getTeamColorPath(activeTeamCode)}
              weight="bold"
            >
              {leagueLabelMap[leagueType]} ∨
            </Typography>
          </TouchableOpacity>

          {/* Dropdown Menu (Absolute) */}
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

        {/* Month Selector */}
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

        {/* Calendar Grid Container (Fetching 중일 때만 불투명도 조절) */}
        <Box style={styles.gridContainer} opacity={isFetching ? 0.5 : 1}>
          {/* Calendar Grid Header */}
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

          {/* Calendar Grid Body */}
          <Box
            flexDir="row"
            flexWrap="wrap"
            borderWidth={StyleSheet.hairlineWidth}
            borderColor="team.neutralLight"
          >
            {days.map((cell, idx) => {
              const isEmpty = cell.day === 0;
              return (
                <Box
                  key={`${cell.day}-${idx}`}
                  style={styles.calendarCell}
                  bg={cell.isToday ? "brand.mintAlpha10" : "transparent"}
                >
                  {!isEmpty && (
                    <>
                      <Box flexDir="row" justify="space-between" width="100%">
                        <Typography
                          variant="caption"
                          color={cell.isToday ? "brand.mint" : "text.secondary"}
                        >
                          {cell.day}
                        </Typography>
                        {cell.location && (
                          <Typography
                            variant="caption"
                            weight="bold"
                            color="brand.mint"
                          >
                            {cell.location}
                          </Typography>
                        )}
                      </Box>
                      {cell.hasGame && (
                        <Box flex={1} justify="center" align="center">
                          <Box
                            bg={
                              cell.opponentCode
                                ? getTeamColorPath(cell.opponentCode)
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
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Back to Today Button (현재 보고 있는 월이 오늘이 아닐 때만 노출) */}
        {(year !== today.year || month !== today.month) && (
          <TouchableOpacity
            style={[
              styles.todayBtn,
              { borderColor: getTeamColorPath(activeTeamCode) },
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
              color={getTeamColorPath(activeTeamCode)}
            />
            <Typography
              variant="caption"
              weight="bold"
              color={getTeamColorPath(activeTeamCode)}
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
    fontSize: 40,
  },
  leagueSelector: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    backgroundColor: theme.colors.background,
  },
  dropdownContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 10,
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    width: 150,
    padding: 8,
    ...theme.shadow.card,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border.light,
  },
  gridContainer: {
    width: "100%",
  },
  arrowBtn: {
    padding: 8,
  },
  matchBadgeText: {
    fontSize: 12,
  },
  matchTimeText: {
    fontSize: 9,
  },
  todayBtn: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
});
