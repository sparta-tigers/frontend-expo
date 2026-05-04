import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

/**
 * 대시보드 화면 연동 컴포넌트 (main_1 / main_2)
 *
 * - 연도별 토글(main_1): KBO 상세 랭킹 화면
 * - 일자별 토글(main_2): 월간 캘린더 화면 (특정 팀 경기 일정)
 * - 좌측 꺽쇠(화살표)로 연도/월 이동 기능 활성화
 */
export default function ScheduleScreen() {
  const params = useLocalSearchParams<{ view?: string }>();
  const initialView = params.view === "day" ? "day" : "year";

  const [view, setView] = useState<"year" | "day">(initialView);
  // 초기 날짜: 2026년 3월 (월은 0-indexed 이므로 2)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (view === "year") {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
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
          <Text style={styles.teamLogoText}>KIA</Text>
          <Text style={styles.teamLogoSubText}>TIGERS</Text>
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
            <TouchableOpacity activeOpacity={0.7} onPress={handlePrev} style={styles.iconButton}>
              <MaterialIcons name="chevron-left" size={28} color={theme.colors.team.neutralDark} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{dateText}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleNext} style={styles.iconButton}>
              <MaterialIcons name="chevron-right" size={28} color={theme.colors.team.neutralDark} />
            </TouchableOpacity>
          </View>

          {/* 우측: 정규리그 드롭다운 */}
          <TouchableOpacity activeOpacity={0.8} style={styles.leagueDropdown}>
            <Text style={styles.leagueDropdownText}>정규리그</Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color={theme.colors.team.kiaRed} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. 본문 렌더링 (main_1 or main_2) */}
      {view === "year" ? <Main1RankingView /> : <Main2CalendarView year={currentDate.getFullYear()} month={currentDate.getMonth()} />}


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
          const isMyTeam = row.teamName === "KIA 타이거즈";
          return (
            <View key={row.rank} style={styles.rankingRow}>
              <Text style={[styles.rankNumberText, isMyTeam && styles.myTeamRankNumber]}>{row.rank}</Text>
              
              <View style={[styles.rankingCard, isMyTeam && styles.myTeamRankingCard]}>
                <View style={styles.teamInfoArea}>
                  {/* 로고 더미 */}
                  <View style={[styles.teamBadge, { backgroundColor: row.teamColor }]} />
                  <Text style={[styles.teamNameText, isMyTeam && styles.myTeamText]} numberOfLines={1}>
                    {row.teamName}
                  </Text>
                </View>
                
                <View style={styles.statsArea}>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.games}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.win}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.lose}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.draw}</Text>
                  <Text style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.winRate}</Text>
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
function Main2CalendarView({ year, month }: { year: number; month: number }) {
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
            <View key={`${cell.day || "empty"}-${idx}`} style={[styles.calendarCell, !cell.day && styles.calendarCellEmpty]}>
              {cell.day ? (
                <>
                  <View style={styles.calendarCellTopRow}>
                    <Text style={styles.calendarDayText}>{cell.day}</Text>
                    {cell.location ? (
                      <Text style={[styles.calendarLocationText, cell.location === "A" && styles.calendarLocationAway]}>
                        {cell.location}
                      </Text>
                    ) : null}
                  </View>

                  {cell.hasGame && cell.opponentShort ? (
                    <View style={styles.calendarOpponentWrap}>
                      <View style={[styles.opponentBadgeDummy, { backgroundColor: cell.opponentColor }]} />
                      <Text style={styles.calendarOpponentText}>{cell.opponentShort}</Text>
                    </View>
                  ) : (
                    <View style={styles.calendarEmptySpacer} />
                  )}

                  {cell.timeText ? (
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
function useFakeRankingData() {
  return useMemo(() => {
    return [
      { rank: 1, teamName: "LG 트윈스", teamColor: "#C30452", games: 144, win: 85, lose: 56, draw: 3, winRate: "0.603" },
      { rank: 2, teamName: "한화 이글스", teamColor: "#FF6600", games: 144, win: 83, lose: 57, draw: 4, winRate: "0.593" },
      { rank: 3, teamName: "SSG 랜더스", teamColor: "#CE0E2D", games: 144, win: 75, lose: 65, draw: 4, winRate: "0.536" },
      { rank: 4, teamName: "삼성 라이온즈", teamColor: "#074CA1", games: 144, win: 74, lose: 68, draw: 2, winRate: "0.521" },
      { rank: 5, teamName: "NC 다이노스", teamColor: "#315288", games: 144, win: 71, lose: 67, draw: 6, winRate: "0.514" },
      { rank: 6, teamName: "KT 위즈", teamColor: "#000000", games: 144, win: 71, lose: 68, draw: 5, winRate: "0.511" },
      { rank: 7, teamName: "롯데 자이언츠", teamColor: "#041E42", games: 144, win: 66, lose: 72, draw: 6, winRate: "0.478" },
      { rank: 8, teamName: "KIA 타이거즈", teamColor: "#EA0029", games: 144, win: 65, lose: 75, draw: 4, winRate: "0.464" },
      { rank: 9, teamName: "두산 베어스", teamColor: "#131230", games: 144, win: 61, lose: 77, draw: 6, winRate: "0.442" },
      { rank: 10, teamName: "키움 히어로즈", teamColor: "#820024", games: 144, win: 47, lose: 93, draw: 4, winRate: "0.336" },
    ];
  }, []);
}

function useFakeCalendarData(year: number, month: number) {
  return useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysArray = [];
    
    for (let i = 0; i < firstDay; i++) {
      daysArray.push({ day: null, hasGame: false, location: null, opponentShort: null, opponentColor: null, timeText: null });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const hasGame = d % 3 !== 0; 
      
      const opponents = [
        { name: "SSG", color: "#CE0E2D" },
        { name: "LOTTE", color: "#041E42" },
        { name: "LG", color: "#C30452" },
        { name: "NC", color: "#315288" },
        { name: "DOOSAN", color: "#131230" },
      ];
      const opp = opponents[d % 5];

      daysArray.push({
        day: d,
        hasGame,
        location: d % 2 === 0 ? "H" : "A",
        opponentShort: opp.name,
        opponentColor: opp.color,
        timeText: "18:30",
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
 * Styles
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
    fontWeight: "900",
    color: theme.colors.text.primary,
    fontStyle: "italic",
  },
  teamLogoSubText: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.team.kiaRed,
    fontStyle: "italic",
    letterSpacing: 2,
    marginTop: -4,
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
    padding: 2,
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
    minWidth: 100,
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
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.kiaRed,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContentPad: {
    paddingBottom: 100,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  tableHeaderText: {
    fontSize: 11,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.bold,
    textAlign: "center",
  },
  colRank: { width: 30 },
  colTeam: { flex: 1, textAlign: "left", paddingLeft: theme.spacing.xl },
  colStat: { width: 35 },
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
    width: 30,
    textAlign: "center",
    fontSize: theme.typography.size.xl,
    fontWeight: "900",
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
    height: 52,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card,
  },
  myTeamRankingCard: {
    borderWidth: 1.5,
    borderColor: theme.colors.brand.mint,
  },
  teamInfoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  teamBadge: {
    width: 24,
    height: 24,
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
    width: 35,
    textAlign: "center",
    fontSize: 12,
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
    height: 36,
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
    borderWidth: 1,
    borderColor: theme.colors.team.neutralLight,
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 80,
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
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
  },
  calendarLocationText: {
    fontSize: 10,
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
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    marginBottom: 2,
  },
  calendarOpponentText: {
    fontSize: 9,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  calendarEmptySpacer: {
    flex: 1,
  },
  calendarTimeText: {
    fontSize: 10,
    color: theme.colors.brand.subtitle,
  },

});
