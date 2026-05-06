import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// ========================================================
// Interfaces — Mock 데이터에도 타입 안전성 강제
// ========================================================

import { RankingRowDto } from "@/src/features/home/types";
import { getTeamColor } from "@/src/utils/team";
import { useFakeHomeData } from "@/src/features/home/mocks";

/** 월간 캘린더의 단일 셀 데이터 */
interface CalendarDayDto {
  /** null이면 빈 셀 (월 시작 전 / 종료 후 패딩) */
  day: number | null;
  hasGame: boolean;
  /** "H" (홈) | "A" (어웨이) | null */
  location: string | null;
  opponentShort: string | null;
  opponentColor: string | null;
  timeText: string | null;
}

// ========================================================
// 화면 전용 레이아웃 상수 (theme 비대화 방지)
// ========================================================
const SCHEDULE_LAYOUT = {
  teamLogoSubFontSize: 28,
  teamLogoMarginTop: -4,
  togglePadding: 2,
  rankCardHeight: 52,
  rankNumberWidth: 30,
  statColWidth: 35,
  calendarHeaderHeight: 36,
  calendarCellHeight: 80,
  opponentBadgeSize: 24,
  scrollBottomPadding: 100,
  letterSpacing: 2,
  dateMinWidth: 100,
  myTeamBorderWidth: 1.5,
  calendarBorderWidth: 1,
  opponentBadgeMarginBottom: 2,
  calendarLocationFontSize: 10,  // xs - 2
  calendarOpponentFontSize: 9,   // xs - 3
  calendarTimeFontSize: 10,      // xs - 2
  headerLabelFontSize: 11,       // xs - 1
  dropdownLabelFontSize: 10,     // xs - 2
} as const;

/**
 * 대시보드 화면 연동 컴포넌트 (main_1 / main_2)
 *
 * - 연도별 토글(main_1): KBO 상세 랭킹 화면
 * - 일자별 토글(main_2): 월간 캘린더 화면 (특정 팀 경기 일정)
 * - 좌측 꺽쇠(화살표)로 연도/월 이동 기능 활성화
 */
export default function ScheduleScreen() {
  const params = useLocalSearchParams<{ 
    view?: string; 
    day?: string;
    year?: string;
    month?: string;
  }>();
  
  const { myTeam } = useFakeHomeData();
  
  const initialView = params.view === "day" ? "day" : "year";
  
  // [RC-7] URL 파라미터를 소스로 사용하여 결정론적 상태 초기화
  const initialDate = useMemo(() => {
    const y = params.year ? parseInt(params.year) : 2026;
    const m = params.month ? parseInt(params.month) : 2; // March
    const d = params.day ? parseInt(params.day) : 1;
    return new Date(y, m, d);
  }, [params.year, params.month, params.day]);

  const [view, setView] = useState<"year" | "day">(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate);

  // 🚨 앙드레 카파시: 라우트 파라미터 변경 시 상태 동기화 (외부 진입 대응)
  // Why: 이미 마운트된 상태에서 다른 파라미터로 재진입 시 상태가 갱신되지 않는 문제 해결
  React.useEffect(() => {
    if (params.view === "day" || params.view === "year") {
      setView(params.view as "year" | "day");
    }
    
    if (params.year || params.month || params.day) {
      const y = params.year ? parseInt(params.year) : 2026;
      const m = params.month ? parseInt(params.month) : 2;
      const d = params.day ? parseInt(params.day) : 1;
      setCurrentDate(new Date(y, m, d));
    }
  }, [params.view, params.year, params.month, params.day]);

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (view === "year") {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        // 🚨 앙드레 카파시: 날짜 불변성 유지 및 Overflow 방지
        // Why: 31일에서 30일/28일 월로 이동 시 March로 튀는 현상 방지 위해 1일로 세팅 후 이동
        newDate.setDate(1);
        newDate.setMonth(prev.getMonth() - 1);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (view === "year") {
        newDate.setFullYear(prev.getFullYear() + 1);
      } else {
        // 🚨 앙드레 카파시: 날짜 불변성 유지 및 Overflow 방지 위해 1일로 세팅 후 이동
        newDate.setDate(1);
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const dateText =
    view === "year"
      ? `${currentDate.getFullYear()}년`
      : `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* 1. 상단 로고 및 헤더 영역 */}
      <View style={styles.topHeader}>
        {/* KIA TIGERS 로고 (가짜 뷰로 대체) */}
        <View style={styles.teamLogoContainer}>
          <Text style={styles.teamLogoText}>{myTeam.shortName}</Text>
          <Text style={styles.teamLogoSubText}>{myTeam.subName}</Text>
        </View>
      </View>

      {/* 2. 공통 필터 영역 (Toggle, Date, League) */}
      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          {/* 일자별 / 연도별 토글 */}
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView("day")}
              style={[styles.togglePill, view === "day" && styles.togglePillActive]}
            >
              <Text style={[styles.togglePillText, view === "day" && styles.togglePillTextActive]}>
                일자별
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView("year")}
              style={[styles.togglePill, view === "year" && styles.togglePillActive]}
            >
              <Text style={[styles.togglePillText, view === "year" && styles.togglePillTextActive]}>
                연도별
              </Text>
            </TouchableOpacity>
          </View>

          {/* 중앙: 날짜 선택기 */}
          <View style={styles.dateSelector}>
            <TouchableOpacity activeOpacity={0.7} onPress={handlePrev} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="이전">
              <MaterialIcons name="chevron-left" size={28} color={theme.colors.team.neutralDark} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{dateText}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleNext} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="다음">
              <MaterialIcons name="chevron-right" size={28} color={theme.colors.team.neutralDark} />
            </TouchableOpacity>
          </View>

          {/* 우측: 정규리그 드롭다운 */}
          <TouchableOpacity activeOpacity={0.8} style={styles.leagueDropdown}>
            <Text style={styles.leagueDropdownText}>정규리그</Text>
            <MaterialIcons name="keyboard-arrow-down" size={theme.typography.size.md} color={theme.colors.team.kiaRed} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. 본문 렌더링 (main_1 or main_2) */}
      {view === "year" ? (
        <Main1RankingView />
      ) : (
        <Main2CalendarView 
          year={currentDate.getFullYear()} 
          month={currentDate.getMonth()} 
          selectedDay={currentDate.getDate()}
        />
      )}


    </SafeLayout>
  );
}

/**
 * ========================================================
 * [main_1] 연도별 토글 시: 상세 랭킹 UI
 * ========================================================
 */
function Main1RankingView() {
  const rankingData = useFakeRankingData();

  return (
    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentPad}>
      {/* 컬럼 헤더 */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, styles.colRank]}>순위</Text>
        <Text style={[styles.tableHeaderText, styles.colTeam]}>팀명</Text>
        <Text style={[styles.tableHeaderText, styles.colStat]}>경기수</Text>
        <Text style={[styles.tableHeaderText, styles.colStat]}>승</Text>
        <Text style={[styles.tableHeaderText, styles.colStat]}>패</Text>
        <Text style={[styles.tableHeaderText, styles.colStat]}>무</Text>
        <Text style={[styles.tableHeaderText, styles.colStat]}>승률</Text>
      </View>

      {/* 랭킹 리스트 */}
      <View style={styles.rankingList}>
        {rankingData.map((row) => {
          const isMyTeam = !!row.isMyTeam;
          return (
            <View key={row.team.name} style={styles.rankingRow}>
              <Text style={[styles.rankNumberText, isMyTeam && styles.myTeamRankNumber]}>{row.rank}</Text>
              
              <View style={[styles.rankingCard, isMyTeam && styles.myTeamRankingCard]}>
                <View style={styles.teamInfoArea}>
                  {/* 로고 더미 */}
                  <View style={[styles.teamBadge, { backgroundColor: getTeamColor(row.team.name) }]} />
                  <Text style={[styles.teamNameText, isMyTeam && styles.myTeamText]} numberOfLines={1}>
                    {row.team.name}
                  </Text>
                </View>
                
                <View style={styles.statsArea}>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.games}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.win}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.lose}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.draw}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.winRate.toFixed(3)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * ========================================================
 * [main_2] 일자별 토글 시: 월간 달력 UI (특정 팀 일정)
 * ========================================================
 */
function Main2CalendarView({ 
  year, 
  month,
  selectedDay 
}: { 
  year: number; 
  month: number;
  selectedDay?: number;
}) {
  const { days } = useFakeCalendarData(year, month);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentPad}>
      <View style={styles.calendarWrap}>
        {/* 요일 헤더 */}
        <View style={styles.calendarHeader}>
          {weekDays.map((d, idx) => (
            <View key={d} style={styles.calendarHeaderCell}>
              <Text
                style={[
                  styles.calendarHeaderText,
                  idx === 0 && styles.calendarTextRed,
                  idx === 6 && styles.calendarTextBlue,
                ]}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* 달력 그리드 */}
        <View style={styles.calendarGrid}>
          {days.map((cell, idx) => (
            <View 
              key={`${cell.day || "empty"}-${idx}`} 
              style={[
                styles.calendarCell, 
                !cell.day && styles.calendarCellEmpty,
                cell.day === selectedDay && styles.calendarCellSelected
              ]}
            >
              {cell.day ? (
                <>
                  <View style={styles.calendarCellTopRow}>
                    <Text style={styles.calendarDayText}>{cell.day}</Text>
                    {cell.hasGame && cell.location ? (
                      <Text style={[styles.calendarLocationText, cell.location === "A" && styles.calendarLocationAway]}>
                        {cell.location}
                      </Text>
                    ) : null}
                  </View>

                  {cell.hasGame && cell.opponentShort ? (
                    <View style={styles.calendarOpponentWrap}>
                      <View style={[styles.opponentBadgeDummy, { backgroundColor: cell.opponentColor ?? theme.colors.team.fallback }]} />
                      <Text style={styles.calendarOpponentText}>{cell.opponentShort}</Text>
                    </View>
                  ) : (
                    <View style={styles.calendarEmptySpacer} />
                  )}

                  {cell.hasGame && cell.timeText ? (
                    <Text style={styles.calendarTimeText}>{cell.timeText}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * ========================================================
 * Mock Data Hooks
 * ========================================================
 */
function useFakeRankingData(): RankingRowDto[] {
  return useMemo(() => {
    return [
      { rank: 1, team: { name: "LG 트윈스", shortName: "LG", subName: "트윈스", mascotEmoji: "👯" }, games: 144, win: 85, lose: 56, draw: 3, winRate: 0.603 },
      { rank: 2, team: { name: "한화 이글스", shortName: "한화", subName: "이글스", mascotEmoji: "🦅" }, games: 144, win: 83, lose: 57, draw: 4, winRate: 0.593 },
      { rank: 3, team: { name: "SSG 랜더스", shortName: "SSG", subName: "랜더스", mascotEmoji: "🛸" }, games: 144, win: 75, lose: 65, draw: 4, winRate: 0.536 },
      { rank: 4, team: { name: "삼성 라이온즈", shortName: "삼성", subName: "라이온즈", mascotEmoji: "🦁" }, games: 144, win: 74, lose: 68, draw: 2, winRate: 0.521 },
      { rank: 5, team: { name: "NC 다이노스", shortName: "NC", subName: "다이노스", mascotEmoji: "🦖" }, games: 144, win: 71, lose: 67, draw: 6, winRate: 0.514 },
      { rank: 6, team: { name: "KT 위즈", shortName: "KT", subName: "위즈", mascotEmoji: "🧙" }, games: 144, win: 71, lose: 68, draw: 5, winRate: 0.511 },
      { rank: 7, team: { name: "롯데 자이언츠", shortName: "롯데", subName: "자이언츠", mascotEmoji: "⚓" }, games: 144, win: 66, lose: 72, draw: 6, winRate: 0.478 },
      { rank: 8, team: { name: "KIA 타이거즈", shortName: "KIA", subName: "타이거즈", mascotEmoji: "🐯" }, games: 144, win: 65, lose: 75, draw: 4, winRate: 0.464, isMyTeam: true },
      { rank: 9, team: { name: "두산 베어스", shortName: "두산", subName: "베어스", mascotEmoji: "🐻" }, games: 144, win: 61, lose: 77, draw: 6, winRate: 0.442 },
      { rank: 10, team: { name: "키움 히어로즈", shortName: "키움", subName: "히어로즈", mascotEmoji: "🦸" }, games: 144, win: 47, lose: 93, draw: 4, winRate: 0.336 },
    ];
  }, []);
}

function useFakeCalendarData(year: number, month: number): { days: CalendarDayDto[] } {
  return useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysArray: CalendarDayDto[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      daysArray.push({ day: null, hasGame: false, location: null, opponentShort: null, opponentColor: null, timeText: null });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const hasGame = d % 3 !== 0; 
      
      const opponents = [
        { name: "SSG", color: theme.colors.team.ssg },
        { name: "LOTTE", color: theme.colors.team.lotte },
        { name: "LG", color: theme.colors.team.lg },
        { name: "NC", color: theme.colors.team.nc },
        { name: "DOOSAN", color: theme.colors.team.doosan },
      ];
      const opp = opponents[d % 5];

      daysArray.push({
        day: d,
        hasGame,
        location: hasGame ? (d % 2 === 0 ? "H" : "A") : null,
        opponentShort: hasGame ? opp.name : null,
        opponentColor: hasGame ? opp.color : null,
        timeText: hasGame ? "18:30" : null,
      });
    }

    const totalCells = Math.ceil(daysArray.length / 7) * 7;
    while (daysArray.length < totalCells) {
      daysArray.push({ day: null, hasGame: false, location: null, opponentShort: null, opponentColor: null, timeText: null });
    }

    return { days: daysArray };
  }, [year, month]);
}

/**
 * ========================================================
 * Styles — 모든 수치는 theme 토큰 또는 SCHEDULE_LAYOUT 참조
 * ========================================================
 */
const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  topHeader: {
    alignItems: "center",
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },

  teamLogoContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    alignItems: "center",
  },
  teamLogoText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.black,
    color: theme.colors.text.primary,
    fontStyle: "italic",
  },
  teamLogoSubText: {
    fontSize: SCHEDULE_LAYOUT.teamLogoSubFontSize,
    fontWeight: theme.typography.weight.black,
    color: theme.colors.team.kiaRed,
    fontStyle: "italic",
    letterSpacing: SCHEDULE_LAYOUT.letterSpacing,
    marginTop: SCHEDULE_LAYOUT.teamLogoMarginTop,
  },
  filterSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.full,
    padding: SCHEDULE_LAYOUT.togglePadding,
    borderWidth: 1,
    borderColor: theme.colors.team.neutralLight,
    backgroundColor: theme.colors.surface,
  },
  togglePill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  togglePillActive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.brand.mint,
    borderWidth: 1,
  },
  togglePillText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.brand.subtitle,
  },
  togglePillTextActive: {
    color: theme.colors.brand.mint,
    fontWeight: theme.typography.weight.bold,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    minWidth: SCHEDULE_LAYOUT.dateMinWidth,
    textAlign: "center",
  },
  leagueDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.team.kiaRed,
  },
  leagueDropdownText: {
    fontSize: SCHEDULE_LAYOUT.dropdownLabelFontSize,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.kiaRed,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContentPad: {
    paddingBottom: SCHEDULE_LAYOUT.scrollBottomPadding,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  tableHeaderText: {
    fontSize: SCHEDULE_LAYOUT.headerLabelFontSize,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.bold,
    textAlign: "center",
  },
  colRank: { width: SCHEDULE_LAYOUT.rankNumberWidth },
  colTeam: { flex: 1, textAlign: "left", paddingLeft: theme.spacing.xl },
  colStat: { width: SCHEDULE_LAYOUT.statColWidth },
  rankingList: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  rankNumberText: {
    width: SCHEDULE_LAYOUT.rankNumberWidth,
    textAlign: "center",
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.black,
    color: theme.colors.brand.subtitle,
  },
  myTeamRankNumber: {
    color: theme.colors.brand.mint,
  },
  rankingCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    height: SCHEDULE_LAYOUT.rankCardHeight,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card,
  },
  myTeamRankingCard: {
    borderWidth: SCHEDULE_LAYOUT.myTeamBorderWidth,
    borderColor: theme.colors.brand.mint,
  },
  teamInfoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  teamBadge: {
    width: SCHEDULE_LAYOUT.opponentBadgeSize,
    height: SCHEDULE_LAYOUT.opponentBadgeSize,
    borderRadius: theme.radius.full,
  },
  teamNameText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  myTeamText: {
    color: theme.colors.brand.mint,
  },
  statsArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValueText: {
    width: SCHEDULE_LAYOUT.statColWidth,
    textAlign: "center",
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.brand.subtitle,
  },
  myTeamStatText: {
    color: theme.colors.brand.mint,
  },
  calendarWrap: {
    paddingHorizontal: theme.spacing.lg,
  },
  calendarHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.team.neutralLight,
    borderTopLeftRadius: theme.radius.dashboardCard,
    borderTopRightRadius: theme.radius.dashboardCard,
    height: SCHEDULE_LAYOUT.calendarHeaderHeight,
  },
  calendarHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarHeaderText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.brand.subtitle,
  },
  calendarTextRed: { color: theme.colors.team.kiaRed },
  calendarTextBlue: { color: theme.colors.brand.mint },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.radius.dashboardCard,
    borderBottomRightRadius: theme.radius.dashboardCard,
    borderWidth: SCHEDULE_LAYOUT.calendarBorderWidth,
    borderColor: theme.colors.team.neutralLight,
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: SCHEDULE_LAYOUT.calendarCellHeight,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.team.neutralLight,
    padding: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarCellEmpty: {
    backgroundColor: theme.colors.surface,
  },
  calendarCellTopRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  calendarDayText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
  },
  calendarLocationText: {
    fontSize: SCHEDULE_LAYOUT.calendarLocationFontSize,
    color: theme.colors.brand.mint,
    fontWeight: theme.typography.weight.bold,
  },
  calendarLocationAway: {
    color: theme.colors.brand.subtitle,
  },
  calendarOpponentWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  opponentBadgeDummy: {
    width: SCHEDULE_LAYOUT.opponentBadgeSize,
    height: SCHEDULE_LAYOUT.opponentBadgeSize,
    borderRadius: theme.radius.full,
    marginBottom: SCHEDULE_LAYOUT.opponentBadgeMarginBottom,
  },
  calendarOpponentText: {
    fontSize: SCHEDULE_LAYOUT.calendarOpponentFontSize,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  calendarEmptySpacer: {
    flex: 1,
  },
  calendarTimeText: {
    fontSize: SCHEDULE_LAYOUT.calendarTimeFontSize,
    color: theme.colors.brand.subtitle,
  },
  calendarCellSelected: {
    backgroundColor: theme.colors.brand.mint + "10", // 10% 투명도
    borderColor: theme.colors.brand.mint,
    borderWidth: 1,
  },
});
