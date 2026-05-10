import { Box } from "@/components/ui/box";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { fetchLiveBoardRooms } from "@/src/features/liveboard/api";
import {
    LiveBoardRoomDto,
    RainType,
    SkyStatus,
} from "@/src/features/liveboard/types";
import { theme } from "@/src/styles/theme";
import { getTeamBgStyle } from "@/src/utils/team";

import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  // 캘린더
  dateCircleSize: 28, // 디자인: 선택 날짜 원형 크기
  dotSize: 8, // 디자인: Check_fill 도트 크기
  calendarPaddingH: 30, // 디자인: 캘린더 좌우 패딩
  calendarRowGap: 2, // 디자인: 요일/날짜/도트 행 간격
  // 매치 카드
  cardHeight: 100, // 디자인: 카드 고정 높이
  cardRadius: 18, // 디자인: rounded-[18px]
  cardPaddingH: 19, // 디자인: px-[19px]
  cardPaddingV: 6, // 디자인: py-[6px]
  cardGap: 5, // 디자인: gap-[5px]
  teamBlockWidth: 73, // 디자인: 팀 블록 너비
  teamLogoSize: 45, // 디자인: 팀 로고 높이 (현재 원형 유지)
  centerBlockWidth: 112, // 디자인: 중앙 블록 너비
  weatherIconSize: 15, // 디자인: 날씨 아이콘 크기
  navArrowPadding: theme.spacing.xs,
  matchListHorizontalPadding: theme.spacing.xxxl, // 디자인: px-[30px]
  matchListBottomPadding: theme.layout.dashboard.matchListBottomPadding,
  matchListGap: theme.spacing.xl, // 디자인: gap-[20px]
} as const;

// ========================================================
// 날씨 아이콘/텍스트 매핑
// ========================================================
type WeatherIconName = keyof typeof MaterialIcons.glyphMap;

interface WeatherDisplay {
  text: string;
  icon: WeatherIconName;
}

function getWeatherDisplay(
  skyStatus: SkyStatus | null | undefined,
  rainType: RainType | null | undefined,
): WeatherDisplay {
  // 강수 형태 우선
  if (rainType && rainType !== "NONE") {
    switch (rainType) {
      case "RAIN":
      case "RAINDROP":
        return { text: "비", icon: "umbrella" };
      case "RAIN_SNOW":
      case "RAINDROP_SNOW_FLYING":
        return { text: "비/눈", icon: "ac-unit" };
      case "SNOW":
      case "SNOW_FLYING":
        return { text: "눈", icon: "ac-unit" };
    }
  }
  // 하늘 상태
  switch (skyStatus) {
    case "SUNNY":
      return { text: "맑음", icon: "wb-sunny" };
    case "CLOUDY_PARTLY":
      return { text: "구름많음", icon: "wb-cloudy" };
    case "CLOUDY":
      return { text: "흐림", icon: "cloud" };
    default:
      return { text: "맑음", icon: "wb-sunny" };
  }
}

// ========================================================
// 주간 날짜 계산
// ========================================================
interface WeekDayDto {
  dayOfWeek: string;
  date: number;
  fullDate: Date;
  hasGame: boolean;
  anydayKey: string; // yyyyMMdd
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toAnydayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getWeekStartDate(baseDate: Date, weekOffset: number): Date {
  const d = new Date(baseDate);
  // 이번 주 월요일 기준
  const dayOfWeek = d.getDay(); // 0=일, 1=월 ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekDays(
  weekStart: Date,
  rooms: LiveBoardRoomDto[],
): WeekDayDto[] {
  // 해당 주에 경기가 있는 날짜 키 Set
  const gameDays = new Set(
    rooms.map((r) => {
      const d = new Date(r.matchTime);
      return toAnydayKey(d);
    }),
  );

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toAnydayKey(d);
    return {
      dayOfWeek: DAY_LABELS[d.getDay()],
      date: d.getDate(),
      fullDate: d,
      hasGame: gameDays.has(key),
      anydayKey: key,
    };
  });
}

function formatWeekLabel(weekStart: Date): string {
  const year = weekStart.getFullYear();
  const month = weekStart.getMonth() + 1;
  const weekOfMonth = Math.ceil(weekStart.getDate() / 7);
  const weekLabels = ["첫째", "둘째", "셋째", "넷째", "다섯째"];
  return `${year}년 ${month}월 ${weekLabels[weekOfMonth - 1] ?? weekOfMonth + "번째"} 주`;
}

// ========================================================
// 메인 화면
// ========================================================

/**
 * 라이브보드 화면
 *
 * Why: 경기 일정과 매치업 정보를 실제 API 데이터로 제공.
 * - GET /api/liveboard/room?anyday=yyyyMMdd 로 해당 날짜 경기 목록 조회
 * - 주간 캘린더는 현재 날짜 기준으로 계산, 주 이동 시 재조회
 * - 날짜 선택 시 해당 날짜 경기만 필터링하여 표시
 */
export default function LiveboardScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedAnyday, setSelectedAnyday] = useState<string>(
    toAnydayKey(today),
  );

  const weekStart = useMemo(
    () => getWeekStartDate(today, weekOffset),
    [today, weekOffset],
  );

  // 주간 전체 날짜 키 목록 (월~일)
  const weekAnydayKeys = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return toAnydayKey(d);
      }),
    [weekStart],
  );

  // 선택된 날짜의 경기 목록 조회
  const { data: selectedDayRooms = [], isLoading } = useQuery({
    queryKey: ["liveboard", "rooms", selectedAnyday],
    queryFn: () => fetchLiveBoardRooms(selectedAnyday),
    staleTime: 60_000,
  });

  // 주간 전체 hasGame 도트를 위해 7일치 병렬 조회 (단일 쿼리로 묶어 Hook 규칙 준수)
  const { data: weekRoomsMap = {} } = useQuery({
    queryKey: ["liveboard", "week", weekAnydayKeys[0]],
    queryFn: async () => {
      const results = await Promise.all(
        weekAnydayKeys.map((key) =>
          fetchLiveBoardRooms(key).then((rooms) => ({ key, rooms })),
        ),
      );
      return Object.fromEntries(results.map(({ key, rooms }) => [key, rooms]));
    },
    staleTime: 60_000,
  });

  // 주간 전체 rooms (hasGame 계산용)
  const allWeekRooms = useMemo(
    () => Object.values(weekRoomsMap).flat(),
    [weekRoomsMap],
  );

  const weekDays = useMemo(
    () => buildWeekDays(weekStart, allWeekRooms),
    [weekStart, allWeekRooms],
  );

  const weekLabel = useMemo(() => formatWeekLabel(weekStart), [weekStart]);

  const selectedDay = weekDays.find((d) => d.anydayKey === selectedAnyday);

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      {/* 주간 캘린더 네비게이션 */}
      <Box flexDir="row" align="center" justify="center" gap="xxl" mb="md">
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navArrowBtn}
          onPress={() => setWeekOffset((prev) => prev - 1)}
          accessibilityRole="button"
          accessibilityLabel="이전 주"
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={theme.colors.team.neutralDark}
          />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" center>
          {weekLabel}
        </Typography>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navArrowBtn}
          onPress={() => setWeekOffset((prev) => prev + 1)}
          accessibilityRole="button"
          accessibilityLabel="다음 주"
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={theme.colors.team.neutralDark}
          />
        </TouchableOpacity>
      </Box>

      {/* 주간 날짜 캘린더: 요일 행 / 날짜 행 / 도트 행 분리 */}
      <Box style={styles.calendarContainer} mb="lg">
        {/* 요일 행 */}
        <Box flexDir="row" justify="space-between" mb="xxs">
          {weekDays.map((day) => (
            <Box key={day.anydayKey} style={styles.calendarCell} align="center">
              <Typography
                style={styles.dayOfWeekText}
                weight="regular"
                color="text.tertiary"
              >
                {day.dayOfWeek}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 날짜 행 */}
        <Box flexDir="row" justify="space-between" mb="xxs">
          {weekDays.map((day) => {
            const isSelected = day.anydayKey === selectedAnyday;
            return (
              <TouchableOpacity
                key={day.anydayKey}
                style={styles.calendarCell}
                onPress={() => setSelectedAnyday(day.anydayKey)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${day.date}일 ${day.dayOfWeek}요일 ${day.hasGame ? "경기 있음" : "경기 없음"}`}
              >
                <Box
                  width={LOCAL_LAYOUT.dateCircleSize}
                  height={LOCAL_LAYOUT.dateCircleSize}
                  align="center"
                  justify="center"
                  style={[
                    styles.dateCircle,
                    isSelected && styles.selectedDateCircle,
                  ]}
                >
                  <Typography
                    style={[
                      styles.dateText,
                      isSelected && styles.selectedDateText,
                    ]}
                    weight="bold"
                  >
                    {day.date}
                  </Typography>
                </Box>
              </TouchableOpacity>
            );
          })}
        </Box>

        {/* 도트 행 */}
        <Box flexDir="row" justify="space-between">
          {weekDays.map((day) => {
            const isSelected = day.anydayKey === selectedAnyday;
            return (
              <Box
                key={day.anydayKey}
                style={styles.calendarCell}
                align="center"
              >
                <Box
                  width={LOCAL_LAYOUT.dotSize}
                  height={LOCAL_LAYOUT.dotSize}
                  style={[
                    styles.dot,
                    day.hasGame
                      ? isSelected
                        ? styles.dotActive
                        : styles.dotInactive
                      : styles.dotHidden,
                  ]}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 매치 리스트 */}
      {isLoading ? (
        <Box flex={1} align="center" justify="center">
          <ActivityIndicator color={theme.colors.brand.mint} />
        </Box>
      ) : selectedDayRooms.length === 0 ? (
        <Box flex={1} align="center" justify="center" gap="sm">
          <MaterialIcons
            name="sports-baseball"
            size={40}
            color={theme.colors.text.secondary}
          />
          <Typography variant="body1" color="text.secondary" weight="medium">
            {selectedDay
              ? `${selectedDay.date}일에는 경기가 없습니다`
              : "경기 정보가 없습니다"}
          </Typography>
        </Box>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.matchList}
        >
          {selectedDayRooms.map((room) => {
            const matchDate = new Date(room.matchTime);
            const timeText = `${String(matchDate.getHours()).padStart(2, "0")}:${String(matchDate.getMinutes()).padStart(2, "0")}`;

            // 날씨: TODAY 경기는 nowCast, 나머지는 foreCast 첫 번째 항목 사용
            const weather =
              room.liveBoardStatus === "TODAY" && room.nowCast
                ? getWeatherDisplay(
                    room.nowCast.skyStatus,
                    room.nowCast.rainType,
                  )
                : room.foreCast?.[0]
                  ? getWeatherDisplay(
                      room.foreCast[0].skyStatus,
                      room.foreCast[0].rainType,
                    )
                  : null;

            return (
              <TouchableOpacity
                key={room.matchId}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/liveboard/[matchId]",
                    params: {
                      matchId: String(room.matchId),
                      awayTeamName: room.awayTeamName,
                      homeTeamName: room.homeTeamName,
                      stadium: room.stadium ?? "",
                      matchTime: room.matchTime,
                    },
                  })
                }
              >
                <Box
                  bg="card"
                  flexDir="row"
                  align="center"
                  style={styles.matchCard}
                >
                  {/* 어웨이 팀 */}
                  <Box align="center" justify="center" style={styles.teamBlock}>
                    <Box
                      width={LOCAL_LAYOUT.teamLogoSize}
                      height={LOCAL_LAYOUT.teamLogoSize}
                      rounded="full"
                      align="center"
                      justify="center"
                      style={[
                        styles.teamLogo,
                        getTeamBgStyle(room.awayTeamName),
                      ]}
                    >
                      <Typography
                        variant="caption"
                        color="background"
                        weight="black"
                      >
                        {room.awayTeamName}
                      </Typography>
                    </Box>
                    <Typography style={styles.teamNameText} weight="bold">
                      {room.awayTeamName}
                    </Typography>
                  </Box>

                  {/* 경기 정보 (중앙) */}
                  <Box
                    align="center"
                    justify="center"
                    style={styles.centerBlock}
                  >
                    {/* 시간 + 구장 */}
                    <Box align="center" style={styles.timeStadiumBlock}>
                      <Typography style={styles.timeText} weight="semibold">
                        {timeText}
                      </Typography>
                      <Typography style={styles.stadiumText} weight="medium">
                        {room.stadium ?? "-"}
                      </Typography>
                    </Box>
                    {/* 날씨 */}
                    {weather && (
                      <Box flexDir="row" align="center">
                        <MaterialIcons
                          name={weather.icon}
                          size={LOCAL_LAYOUT.weatherIconSize}
                          color={theme.colors.brand.mint}
                        />
                        <Typography style={styles.weatherText} weight="bold">
                          {weather.text}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* 홈 팀 */}
                  <Box align="center" justify="center" style={styles.teamBlock}>
                    <Box
                      width={LOCAL_LAYOUT.teamLogoSize}
                      height={LOCAL_LAYOUT.teamLogoSize}
                      rounded="full"
                      align="center"
                      justify="center"
                      style={[
                        styles.teamLogo,
                        getTeamBgStyle(room.homeTeamName),
                      ]}
                    >
                      <Typography
                        variant="caption"
                        color="background"
                        weight="black"
                      >
                        {room.homeTeamName}
                      </Typography>
                    </Box>
                    <Typography style={styles.teamNameText} weight="bold">
                      {room.homeTeamName}
                    </Typography>
                  </Box>
                </Box>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  navArrowBtn: {
    padding: LOCAL_LAYOUT.navArrowPadding,
  },
  // ── 캘린더 ──────────────────────────────────────────────
  calendarContainer: {
    paddingHorizontal: LOCAL_LAYOUT.calendarPaddingH,
  },
  calendarCell: {
    flex: 1,
    alignItems: "center",
  },
  dayOfWeekText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  dateText: {
    fontSize: 15,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
    lineHeight: 24,
  },
  dateCircle: {
    borderRadius: LOCAL_LAYOUT.dateCircleSize / 2,
  },
  selectedDateCircle: {
    backgroundColor: theme.colors.brand.mint,
    borderRadius: LOCAL_LAYOUT.dateCircleSize / 2,
  },
  selectedDateText: {
    color: theme.colors.background,
  },
  dot: {
    borderRadius: LOCAL_LAYOUT.dotSize / 2,
  },
  dotActive: {
    backgroundColor: theme.colors.brand.mint,
  },
  dotInactive: {
    backgroundColor: theme.colors.team.neutralLight,
  },
  dotHidden: {
    backgroundColor: theme.colors.transparent,
  },
  // ── 매치 카드 ────────────────────────────────────────────
  matchList: {
    paddingHorizontal: LOCAL_LAYOUT.matchListHorizontalPadding,
    paddingBottom: LOCAL_LAYOUT.matchListBottomPadding,
    gap: LOCAL_LAYOUT.matchListGap,
  },
  matchCard: {
    height: LOCAL_LAYOUT.cardHeight,
    borderRadius: LOCAL_LAYOUT.cardRadius,
    paddingHorizontal: LOCAL_LAYOUT.cardPaddingH,
    paddingVertical: LOCAL_LAYOUT.cardPaddingV,
    gap: LOCAL_LAYOUT.cardGap,
    justifyContent: "center",
    // 디자인: drop-shadow(0px 0px 5.25px rgba(0,0,0,0.1))
    shadowColor: theme.colors.team.kt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5.25,
    elevation: 3,
  },
  teamBlock: {
    width: LOCAL_LAYOUT.teamBlockWidth,
    gap: 4,
  },
  teamLogo: {
    marginBottom: 0,
  },
  teamNameText: {
    fontSize: 12,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
  },
  centerBlock: {
    width: LOCAL_LAYOUT.centerBlockWidth,
    gap: 0,
  },
  timeStadiumBlock: {
    gap: 2,
    paddingVertical: 6,
  },
  timeText: {
    fontSize: 16,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
  },
  stadiumText: {
    fontSize: 11,
    color: theme.colors.brand.subtitle,
    textAlign: "center",
  },
  weatherText: {
    fontSize: 11,
    color: theme.colors.brand.mint,
    textAlign: "center",
  },
});
