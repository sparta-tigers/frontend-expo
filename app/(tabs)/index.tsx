/* eslint-disable react-native/no-color-literals */
import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
      {/* 1. 상단 로고 및 헤더 영역 */}
      <View style={styles.topHeader}>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn}>
          <MaterialIcons name="home" size={28} color={theme.colors.team.neutralDark} />
        </TouchableOpacity>
        
        <Text style={styles.mainTitleText}>YAGUNIV</Text>
        
        {/* 프로필 버튼 */}
        <TouchableOpacity activeOpacity={0.7} style={styles.headerIconBtn} onPress={() => router.push("/profile")}>
          {/* 피그마의 Face ID 아이콘과 유사한 아이콘 또는 프로필 대체용 아이콘 적용 */}
          <MaterialIcons name="person-outline" size={28} color={theme.colors.team.neutralDark} />
        </TouchableOpacity>
      </View>

      {/* 2. 주간 캘린더 네비게이션 */}
      <View style={styles.weekNavRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.navArrowBtn}>
          <MaterialIcons name="chevron-left" size={28} color={theme.colors.team.neutralDark} />
        </TouchableOpacity>
        <Text style={styles.weekNavText}>2026년 3월 첫쨋주</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.navArrowBtn}>
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
        {matches.map((match, idx) => (
          <View key={idx} style={styles.matchCard}>
            {/* 어웨이 팀 */}
            <View style={styles.teamBlock}>
              <View style={[styles.teamLogoDummy, { backgroundColor: getTeamColor(match.away.name) }]}>
                <Text style={styles.teamLogoText}>{match.away.name}</Text>
              </View>
              <Text style={styles.teamName}>{match.away.name}</Text>
            </View>

            {/* 경기 정보 */}
            <View style={styles.infoBlock}>
              <Text style={styles.timeText}>{match.time}</Text>
              <Text style={styles.stadiumText}>{match.stadium}</Text>
              <View style={styles.weatherRow}>
                <MaterialIcons name={match.weather.icon as any} size={14} color={theme.colors.brand.mint} />
                <Text style={styles.weatherText}>{match.weather.text}</Text>
              </View>
            </View>

            {/* 홈 팀 */}
            <View style={styles.teamBlock}>
              <View style={[styles.teamLogoDummy, { backgroundColor: getTeamColor(match.home.name) }]}>
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
function useFakeWeekData() {
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

function useFakeMatchData() {
  return useMemo(() => {
    return [
      {
        away: { name: "한화" },
        home: { name: "LG" },
        time: "18:30",
        stadium: "잠실 야구장",
        weather: { text: "맑음", icon: "wb-sunny" }
      },
      {
        away: { name: "롯데" },
        home: { name: "삼성" },
        time: "18:30",
        stadium: "대구 라이온즈파크",
        weather: { text: "맑음", icon: "wb-sunny" }
      },
      {
        away: { name: "NC" },
        home: { name: "SSG" },
        time: "18:30",
        stadium: "문학 랜더스파크",
        weather: { text: "맑음", icon: "wb-sunny" }
      },
      {
        away: { name: "두산" },
        home: { name: "KT" },
        time: "18:30",
        stadium: "수원 위즈파크",
        weather: { text: "맑음", icon: "wb-sunny" }
      },
      {
        away: { name: "키움" },
        home: { name: "KIA" },
        time: "18:30",
        stadium: "광주 챔피언스필드",
        weather: { text: "맑음", icon: "wb-sunny" }
      },
    ];
  }, []);
}

const getTeamColor = (teamName: string) => {
  const colors: Record<string, string> = {
    "한화": "#FF6600",
    "LG": "#C30452",
    "롯데": "#041E42",
    "삼성": "#074CA1",
    "NC": "#315288",
    "SSG": "#CE0E2D",
    "두산": "#131230",
    "KT": "#000000",
    "키움": "#820024",
    "KIA": "#EA0029",
  };
  return colors[teamName] || "#888888";
};

/**
 * ========================================================
 * Styles
 * ========================================================
 */
const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  headerIconBtn: {
    padding: theme.spacing.xs,
  },
  mainTitleText: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.brand.mint,
    letterSpacing: 1,
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
    fontWeight: "800",
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
    gap: 6,
  },
  dayName: {
    fontSize: 12,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.medium,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleSelected: {
    backgroundColor: "#DCF5F2", // 라이트 민트
  },
  dateText: {
    fontSize: 15,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  dateTextSelected: {
    fontWeight: "bold",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
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
    paddingBottom: 40,
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
    width: 60,
    gap: theme.spacing.sm,
  },
  teamLogoDummy: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoText: {
    fontSize: 11,
    fontWeight: "900",
    color: theme.colors.surface,
  },
  teamName: {
    fontSize: 13,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  infoBlock: {
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text.primary,
  },
  stadiumText: {
    fontSize: 11,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.medium,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  weatherText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.brand.mint,
  },
});
