import { SafeLayout } from "@/components/ui/safe-layout";
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { theme } from "@/src/styles/theme";
import { getTeamBgStyle } from "@/src/utils/team";

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  dateCircleSize: theme.layout.dashboard.calendarHeaderHeight,
  dotSize: 5, // 도메인 특화 수치 유지
  teamLogoSize: 48, // 도메인 특화 수치 유지
  teamBlockWidth: 60,
  dayColGap: 6,
  weatherIconSize: 14,
  navArrowPadding: theme.spacing.xs,
  matchListHorizontalPadding: theme.spacing.xl,
  matchListBottomPadding: theme.layout.dashboard.matchListBottomPadding,
  matchListGap: theme.spacing.md,
} as const;

// ========================================================
// Interfaces
// ========================================================

interface WeekDayDto {
  dayOfWeek: string;
  date: number;
  hasGame: boolean;
}

interface MatchTeamDto {
  name: string;
}

interface MatchWeatherDto {
  text: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface MatchDto {
  id: string;
  away: MatchTeamDto;
  home: MatchTeamDto;
  time: string;
  stadium: string;
  weather: MatchWeatherDto;
}

/**
 * 라이브보드 화면 (`liveboard_0`)
 *
 * Why: 경기 일정과 매치업 정보를 직관적으로 제공하기 위함.
 * Zero-Magic UI 원칙에 따라 Box와 Typography 프리미티브를 사용함.
 */
export default function LiveboardScreen() {
  const [selectedDate, setSelectedDate] = useState(21);
  const weekDays = useFakeWeekData();
  const matches = useFakeMatchData();

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      {/* 주간 캘린더 네비게이션 */}
      <Box flexDir="row" align="center" justify="center" gap="xxl" mb="md">
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.navArrowBtn} 
          accessibilityRole="button" 
          accessibilityLabel="이전 주"
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.colors.team.neutralDark} />
        </TouchableOpacity>
        <Typography variant="h3" weight="extrabold">
          2026년 3월 첫째 주
        </Typography>
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.navArrowBtn} 
          accessibilityRole="button" 
          accessibilityLabel="다음 주"
        >
          <MaterialIcons name="chevron-right" size={28} color={theme.colors.team.neutralDark} />
        </TouchableOpacity>
      </Box>

      {/* 주간 날짜 리스트 */}
      <Box flexDir="row" px="lg" mb="lg">
        {weekDays.map((day) => {
          const isSelected = day.date === selectedDate;
          return (
            <TouchableOpacity 
              key={day.date} 
              style={styles.dayCol}
              onPress={() => setSelectedDate(day.date)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${day.date}일 ${day.dayOfWeek}요일 ${day.hasGame ? '경기 있음' : '경기 없음'}`}
            >
              <Typography variant="caption" color="text.secondary" weight="medium">
                {day.dayOfWeek}
              </Typography>
              <Box 
                width={LOCAL_LAYOUT.dateCircleSize} 
                height={LOCAL_LAYOUT.dateCircleSize} 
                rounded="full" 
                align="center" 
                justify="center"
                bg={isSelected ? "brand.mintLight" : "transparent"}
              >
                <Typography 
                  weight={isSelected ? "bold" : "medium"} 
                  color={isSelected ? "primary" : "text.secondary"}
                >
                  {day.date}
                </Typography>
              </Box>
              <Box 
                width={LOCAL_LAYOUT.dotSize} 
                height={LOCAL_LAYOUT.dotSize} 
                rounded="full" 
                bg={day.hasGame ? (isSelected ? "brand.mint" : "muted") : "transparent"} 
              />
            </TouchableOpacity>
          );
        })}
      </Box>

      {/* 매치 리스트 */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.matchList}>
        {matches.map((match) => (
          <Box 
            key={match.id} 
            bg="card" 
            rounded="lg" 
            py="lg" 
            px="xl" 
            flexDir="row" 
            justify="space-between" 
            align="center"
            style={styles.matchCard}
          >
            {/* 어웨이 팀 */}
            <Box align="center" width={LOCAL_LAYOUT.teamBlockWidth} gap="sm">
              <Box 
                width={LOCAL_LAYOUT.teamLogoSize} 
                height={LOCAL_LAYOUT.teamLogoSize} 
                rounded="full" 
                align="center" 
                justify="center" 
                style={getTeamBgStyle(match.away.name)}
              >
                <Typography variant="caption" color="background" weight="black">
                  {match.away.name}
                </Typography>
              </Box>
              <Typography variant="caption" weight="bold">
                {match.away.name}
              </Typography>
            </Box>

            {/* 경기 정보 */}
            <Box align="center" gap="xs">
              <Typography variant="h2" weight="extrabold">
                {match.time}
              </Typography>
              <Typography variant="caption" color="text.secondary" weight="medium">
                {match.stadium}
              </Typography>
              <Box flexDir="row" align="center" gap="xxs" mt="xxs">
                <MaterialIcons name={match.weather.icon} size={LOCAL_LAYOUT.weatherIconSize} color={theme.colors.brand.mint} />
                <Typography variant="caption" color="brand.mint" weight="extrabold">
                  {match.weather.text}
                </Typography>
              </Box>
            </Box>

            {/* 홈 팀 */}
            <Box align="center" width={LOCAL_LAYOUT.teamBlockWidth} gap="sm">
              <Box 
                width={LOCAL_LAYOUT.teamLogoSize} 
                height={LOCAL_LAYOUT.teamLogoSize} 
                rounded="full" 
                align="center" 
                justify="center" 
                style={getTeamBgStyle(match.home.name)}
              >
                <Typography variant="caption" color="background" weight="black">
                  {match.home.name}
                </Typography>
              </Box>
              <Typography variant="caption" weight="bold">
                {match.home.name}
              </Typography>
            </Box>
          </Box>
        ))}
      </ScrollView>
    </SafeLayout>
  );
}

function useFakeWeekData(): WeekDayDto[] {
  return useMemo(() => [
    { dayOfWeek: "월", date: 16, hasGame: false },
    { dayOfWeek: "화", date: 17, hasGame: true },
    { dayOfWeek: "수", date: 18, hasGame: true },
    { dayOfWeek: "목", date: 19, hasGame: true },
    { dayOfWeek: "금", date: 20, hasGame: true },
    { dayOfWeek: "토", date: 21, hasGame: true },
    { dayOfWeek: "일", date: 22, hasGame: true },
  ], []);
}

function useFakeMatchData(): MatchDto[] {
  return useMemo(() => [
    {
      id: "match-1",
      away: { name: "한화" },
      home: { name: "LG" },
      time: "18:30",
      stadium: "잠실 야구장",
      weather: { text: "맑음", icon: "wb-sunny" }
    },
    {
      id: "match-2",
      away: { name: "롯데" },
      home: { name: "삼성" },
      time: "18:30",
      stadium: "대구 라이온즈파크",
      weather: { text: "맑음", icon: "wb-sunny" }
    },
    {
      id: "match-3",
      away: { name: "NC" },
      home: { name: "SSG" },
      time: "18:30",
      stadium: "문학 랜더스파크",
      weather: { text: "맑음", icon: "wb-sunny" }
    },
    {
      id: "match-4",
      away: { name: "두산" },
      home: { name: "KT" },
      time: "18:30",
      stadium: "수원 위즈파크",
      weather: { text: "맑음", icon: "wb-sunny" }
    },
    {
      id: "match-5",
      away: { name: "키움" },
      home: { name: "KIA" },
      time: "18:30",
      stadium: "광주 챔피언스필드",
      weather: { text: "맑음", icon: "wb-sunny" }
    },
  ], []);
}

const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  navArrowBtn: {
    padding: LOCAL_LAYOUT.navArrowPadding,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: LOCAL_LAYOUT.dayColGap,
  },
  matchList: {
    paddingHorizontal: LOCAL_LAYOUT.matchListHorizontalPadding,
    paddingBottom: LOCAL_LAYOUT.matchListBottomPadding,
    gap: LOCAL_LAYOUT.matchListGap,
  },
  matchCard: {
    ...theme.shadow.card,
  },
});
