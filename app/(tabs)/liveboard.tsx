import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { getTeamBgStyle } from "@/src/utils/team";

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// ========================================================
// Interfaces — Mock 데이터에도 타입 안전성 강제
// ========================================================

/** 주간 캘린더의 단일 날짜 셀 */
interface WeekDayDto {
  /** 요일 한글 (예: "월") */
  dayOfWeek: string;
  /** 일(date) 숫자 (예: 16) */
  date: number;
  /** 해당 날짜에 경기 존재 여부 */
  hasGame: boolean;
}

/** 라이브보드 매치 카드의 팀 정보 */
interface MatchTeamDto {
  name: string;
}

/** 라이브보드 매치 카드의 날씨 정보 */
interface MatchWeatherDto {
  text: string;
  /** MaterialIcons 아이콘 이름 — 타입 안전성을 위해 glyphMap 키로 한정 */
  icon: keyof typeof MaterialIcons.glyphMap;
}

/** 라이브보드 매치 카드 전체 */
interface MatchDto {
  id: string;
  away: MatchTeamDto;
  home: MatchTeamDto;
  time: string;
  stadium: string;
  weather: MatchWeatherDto;
}

// ========================================================
// 화면 전용 레이아웃 상수 (theme 비대화 방지)
// ========================================================
const LIVEBOARD_LAYOUT = {
  dateCircleSize: 32,
  dotSize: 5,
  teamLogoSize: 48,
  teamBlockWidth: 60,
  matchListBottomPadding: 40,
  dayColGap: 6,          // theme.spacing.sm - 2
  dateFontSize: 15,      // theme.typography.size.sm + 1
  smallFontSize: 11,     // theme.typography.size.xs - 1
  teamNameFontSize: 13,  // theme.typography.size.xs + 1
  weatherGap: 2,
  weatherMarginTop: 2,
} as const;

/**
 * 라이브보드 화면 (`liveboard_0`)
 *
 * - 주간 캘린더 (날짜 및 경기 여부 표시)
 * - 해당 일자의 매치업 리스트 (홈/어웨이, 구장, 시간, 날씨)
 */
export default function LiveboardScreen() {
  const [selectedDate, setSelectedDate] = useState(21);
  const weekDays = useFakeWeekData();
  const matches = useFakeMatchData();

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      {/* 2. 주간 캘린더 네비게이션 */}
      <View style={styles.weekNavRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.navArrowBtn} accessibilityRole="button" accessibilityLabel="이전 주">
          <MaterialIcons name="chevron-left" size={28} color={theme.colors.team.neutralDark} />
        </TouchableOpacity>
        <Text style={styles.weekNavText}>2026년 3월 첫째 주</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.navArrowBtn} accessibilityRole="button" accessibilityLabel="다음 주">
          <MaterialIcons name="chevron-right" size={28} color={theme.colors.team.neutralDark} />
        </TouchableOpacity>
      </View>

      {/* 3. 주간 날짜 리스트 */}
      <View style={styles.weekDaysRow}>
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
              <Text style={styles.dayName}>{day.dayOfWeek}</Text>
              <View style={[styles.dateCircle, isSelected && styles.dateCircleSelected]}>
                <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{day.date}</Text>
              </View>
              <View style={[styles.dot, isSelected && styles.dotSelected, !day.hasGame && styles.dotHidden]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. 매치 리스트 */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.matchList}>
        {matches.map((match) => (
          <View key={match.id} style={styles.matchCard}>
            {/* 어웨이 팀 */}
            <View style={styles.teamBlock}>
              <View style={[styles.teamLogoDummy, getTeamBgStyle(match.away.name)]}>
                <Text style={styles.teamLogoText}>{match.away.name}</Text>
              </View>
              <Text style={styles.teamName}>{match.away.name}</Text>
            </View>

            {/* 경기 정보 */}
            <View style={styles.infoBlock}>
              <Text style={styles.timeText}>{match.time}</Text>
              <Text style={styles.stadiumText}>{match.stadium}</Text>
              <View style={styles.weatherRow}>
                <MaterialIcons name={match.weather.icon} size={theme.typography.size.sm} color={theme.colors.brand.mint} />
                <Text style={styles.weatherText}>{match.weather.text}</Text>
              </View>
            </View>

            {/* 홈 팀 */}
            <View style={styles.teamBlock}>
              <View style={[styles.teamLogoDummy, getTeamBgStyle(match.home.name)]}>
                <Text style={styles.teamLogoText}>{match.home.name}</Text>
              </View>
              <Text style={styles.teamName}>{match.home.name}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeLayout>
  );
}

/**
 * ========================================================
 * Mock Data Hooks
 * ========================================================
 */
function useFakeWeekData(): WeekDayDto[] {
  return useMemo(() => {
    return [
      { dayOfWeek: "월", date: 16, hasGame: false },
      { dayOfWeek: "화", date: 17, hasGame: true },
      { dayOfWeek: "수", date: 18, hasGame: true },
      { dayOfWeek: "목", date: 19, hasGame: true },
      { dayOfWeek: "금", date: 20, hasGame: true },
      { dayOfWeek: "토", date: 21, hasGame: true },
      { dayOfWeek: "일", date: 22, hasGame: true },
    ];
  }, []);
}

function useFakeMatchData(): MatchDto[] {
  return useMemo(() => {
    return [
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
    ];
  }, []);
}

/**
 * ========================================================
 * Styles — 모든 수치는 theme 토큰 또는 LIVEBOARD_LAYOUT 참조
 * ========================================================
 */
const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxl,
    marginBottom: theme.spacing.md,
  },
  navArrowBtn: {
    padding: theme.spacing.xs,
  },
  weekNavText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.extrabold,
    color: theme.colors.text.primary,
  },
  weekDaysRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: LIVEBOARD_LAYOUT.dayColGap,
  },
  dayName: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.medium,
  },
  dateCircle: {
    width: LIVEBOARD_LAYOUT.dateCircleSize,
    height: LIVEBOARD_LAYOUT.dateCircleSize,
    borderRadius: LIVEBOARD_LAYOUT.dateCircleSize / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleSelected: {
    backgroundColor: theme.colors.brand.mintLight,
  },
  dateText: {
    fontSize: LIVEBOARD_LAYOUT.dateFontSize,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  dateTextSelected: {
    fontWeight: theme.typography.weight.bold,
  },
  dot: {
    width: LIVEBOARD_LAYOUT.dotSize,
    height: LIVEBOARD_LAYOUT.dotSize,
    borderRadius: LIVEBOARD_LAYOUT.dotSize / 2,
    backgroundColor: theme.colors.brand.subtitle,
  },
  dotSelected: {
    backgroundColor: theme.colors.brand.mint,
  },
  dotHidden: {
    opacity: 0,
  },
  matchList: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: LIVEBOARD_LAYOUT.matchListBottomPadding,
    gap: theme.spacing.md,
  },
  matchCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.dashboardCard,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.shadow.card,
  },
  teamBlock: {
    alignItems: "center",
    width: LIVEBOARD_LAYOUT.teamBlockWidth,
    gap: theme.spacing.sm,
  },
  teamLogoDummy: {
    width: LIVEBOARD_LAYOUT.teamLogoSize,
    height: LIVEBOARD_LAYOUT.teamLogoSize,
    borderRadius: LIVEBOARD_LAYOUT.teamLogoSize / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoText: {
    fontSize: LIVEBOARD_LAYOUT.smallFontSize,
    fontWeight: theme.typography.weight.black,
    color: theme.colors.surface,
  },
  teamName: {
    fontSize: LIVEBOARD_LAYOUT.teamNameFontSize,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  infoBlock: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.extrabold,
    color: theme.colors.text.primary,
  },
  stadiumText: {
    fontSize: LIVEBOARD_LAYOUT.smallFontSize,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.medium,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: LIVEBOARD_LAYOUT.weatherGap,
    marginTop: LIVEBOARD_LAYOUT.weatherMarginTop,
  },
  weatherText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.extrabold,
    color: theme.colors.brand.mint,
  },
});
