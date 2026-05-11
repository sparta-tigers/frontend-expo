// app/(tabs)/liveboard.tsx
// Why: Expo Router 탭 라우트 파일. 로직은 liveboard/ 하위 모듈에 위임.
import { Box } from "@/components/ui/box";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { theme } from "@/src/styles/theme";
import { getTeamBgStyle } from "@/src/utils/team";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  WeekDayDto,
  getWeatherDisplay,
  useLiveboard,
} from "./liveboard/useLiveboard";
import { LOCAL_LAYOUT, styles } from "./liveboard/liveboard.styles";

/**
 * 라이브보드 화면
 *
 * Why: 경기 일정과 매치업 정보를 실제 API 데이터로 제공.
 * 탭 네비게이션 렌더링만 담당. 데이터/상태 로직은 useLiveboard에 위임.
 */
export default function LiveboardScreen() {
  const router = useRouter();
  const {
    setWeekOffset,
    selectedAnyday,
    setSelectedAnyday,
    weekDays,
    weekLabel,
    selectedDay,
    selectedDayRooms,
    isLoading,
    isError,
    refetch,
  } = useLiveboard();

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

      {/* 주간 날짜 캘린더 */}
      <Box style={styles.calendarContainer} mb="lg">
        {/* 요일 행 */}
        <Box flexDir="row" justify="space-between" mb="xxs">
          {weekDays.map((day: WeekDayDto) => (
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
          {weekDays.map((day: WeekDayDto) => {
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
          {weekDays.map((day: WeekDayDto) => {
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
      {isError ? (
        <Box flex={1} align="center" justify="center" gap="md">
          <MaterialIcons
            name="error-outline"
            size={40}
            color={theme.colors.error}
          />
          <Typography variant="body1" color="text.secondary" weight="medium">
            경기 정보를 불러오지 못했어요
          </Typography>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Typography style={styles.retryBtnText} weight="semibold">
              다시 시도
            </Typography>
          </TouchableOpacity>
        </Box>
      ) : isLoading ? (
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

            const weather =
              room.liveBoardStatus === "TODAY" && room.nowCast
                ? getWeatherDisplay(room.nowCast.skyStatus, room.nowCast.rainType)
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
                      style={[styles.teamLogo, getTeamBgStyle(room.awayTeamName)]}
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
                  <Box align="center" justify="center" style={styles.centerBlock}>
                    <Box align="center" style={styles.timeStadiumBlock}>
                      <Typography style={styles.timeText} weight="semibold">
                        {timeText}
                      </Typography>
                      <Typography style={styles.stadiumText} weight="medium">
                        {room.stadium ?? "-"}
                      </Typography>
                    </Box>
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
                      style={[styles.teamLogo, getTeamBgStyle(room.homeTeamName)]}
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
