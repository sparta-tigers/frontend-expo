import { Box, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TEAM_DATA, TeamCode } from "@/src/utils/team";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";
import { useAuth } from "@/context/AuthContext";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";

// ========================================================
// 화면 전용 레이아웃 상수 (theme 비대화 방지)
// ========================================================
const LOCAL_LAYOUT = {
  teamLogoSubFontSize: theme.typography.size.TITLE,
  teamLogoMarginTop: -4,
  togglePadding: 2,
  rankNumberWidth: 30,
  statColWidth: 35,
  calendarHeaderHeight: 36,
  calendarCellHeight: 80,
  opponentBadgeSize: theme.spacing.xxl,
  letterSpacing: 2,
  dateMinWidth: 100,
  myTeamBorderWidth: 1.5,
  calendarBorderWidth: 1,
  opponentBadgeMarginBottom: 2,
  calendarLocationFontSize: theme.typography.size.xs,
  calendarOpponentFontSize: 9,   // 전용 미세 수치
  calendarTimeFontSize: theme.typography.size.xs,
  headerLabelFontSize: 11,       // 전용 미세 수치
  dropdownLabelFontSize: theme.typography.size.xs,
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
  
  const { myTeam: myTeamId } = useAuth();
  
  // [Architecture] Zero-Magic: TEAM_DATA를 직접 참조하여 런타임 오버헤드 최소화
  const teamInfo = myTeamId ? TEAM_DATA[myTeamId] : null;
  
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

  const teamColor = teamInfo?.color || theme.colors.team.fallback;

  return (
    <Box style={styles.safeLayout}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: teamInfo ? `${teamInfo.name} 일정` : "경기 일정",
          headerStyle: { backgroundColor: theme.colors.brand.background },
          headerShadowVisible: false,
        }} 
      />

      {/* 2. 공통 필터 영역 (Toggle, Date, League) */}
      <Box style={styles.filterSection}>
        <Box style={styles.filterRow}>
          {/* 일자별 / 연도별 토글 */}
          <Box style={styles.toggleGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView("day")}
              style={[styles.togglePill, view === "day" && styles.togglePillActive]}
            >
              <Typography style={[styles.togglePillText, view === "day" && styles.togglePillTextActive]}>
                일자별
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setView("year")}
              style={[styles.togglePill, view === "year" && styles.togglePillActive]}
            >
              <Typography style={[styles.togglePillText, view === "year" && styles.togglePillTextActive]}>
                연도별
              </Typography>
            </TouchableOpacity>
          </Box>

          {/* 중앙: 날짜 선택기 */}
          <Box style={styles.dateSelector}>
            <TouchableOpacity activeOpacity={0.7} onPress={handlePrev} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="이전">
              <MaterialIcons name="chevron-left" size={28} color={theme.colors.team.neutralDark} />
            </TouchableOpacity>
            <Typography variant="h1" style={styles.dateText}>{dateText}</Typography>
            <TouchableOpacity activeOpacity={0.7} onPress={handleNext} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="다음">
              <MaterialIcons name="chevron-right" size={28} color={theme.colors.team.neutralDark} />
            </TouchableOpacity>
          </Box>

          {/* 우측: 정규리그 드롭다운 */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.leagueDropdown, { borderColor: teamColor }]}
          >
            <Typography style={[styles.leagueDropdownText, { color: teamColor }]}>정규리그</Typography>
            <MaterialIcons name="keyboard-arrow-down" size={theme.typography.size.md} color={teamColor} />
          </TouchableOpacity>
        </Box>
      </Box>

      {/* 3. 본문 렌더링 (main_1 or main_2) */}
      {view === "year" ? (
        <Main1RankingView />
      ) : (
        <Main2CalendarView 
          year={currentDate.getFullYear()} 
          month={currentDate.getMonth()} 
          selectedDay={currentDate.getDate()}
          teamId={myTeamId}
        />
      )}
    </Box>
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
      <Box style={styles.tableHeaderRow}>
        <Typography style={[styles.tableHeaderText, styles.colRank]}>순위</Typography>
        <Typography style={[styles.tableHeaderText, styles.colTeam]}>팀명</Typography>
        <Typography style={[styles.tableHeaderText, styles.colStat]}>경기수</Typography>
        <Typography style={[styles.tableHeaderText, styles.colStat]}>승</Typography>
        <Typography style={[styles.tableHeaderText, styles.colStat]}>패</Typography>
        <Typography style={[styles.tableHeaderText, styles.colStat]}>무</Typography>
        <Typography style={[styles.tableHeaderText, styles.colStat]}>승률</Typography>
      </Box>

      {/* 랭킹 리스트 */}
      <Box style={styles.rankingList}>
        {rankingData.map((row) => {
          const isMyTeam = !!row.isMyTeam;
          return (
            <Box key={row.team.name} style={styles.rankingRow}>
              <Typography variant="h1" style={[styles.rankNumberText, isMyTeam && styles.myTeamRankNumber]}>{row.rank}</Typography>
              
              <Box style={[styles.rankingCard, isMyTeam && styles.myTeamRankingCard]}>
                <Box style={styles.teamInfoArea}>
                  {/* 로고 더미 */}
                  <Box style={[styles.teamBadge, { backgroundColor: row.team.color }]} />
                  <Typography style={[styles.teamNameText, isMyTeam && styles.myTeamText]} numberOfLines={1}>
                    {row.team.name}
                  </Typography>
                </Box>
                
                <Box style={styles.statsArea}>
                  <Typography style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.games}</Typography>
                  <Typography style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.win}</Typography>
                  <Typography style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.lose}</Typography>
                  <Typography style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.draw}</Typography>
                  <Typography style={[styles.statValueText, isMyTeam && styles.myTeamStatText]}>{row.winRate.toFixed(3)}</Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </ScrollView>
  );
}

function Main2CalendarView({ 
  year, 
  month,
  selectedDay,
  teamId
}: { 
  year: number; 
  month: number;
  selectedDay?: number;
  teamId: TeamCode | null;
}) {
  const { data: scheduleData, isLoading } = useMatchSchedule(
    year, 
    month + 1, // backend expects 1-based month
    teamId
  );
  
  const schedule = scheduleData || [];
  
  // [Type Fix] MatchScheduleDto[] 타입으로 단언하여 useCalendarGrid와의 호환성 확보
  const days = useCalendarGrid(year, month, schedule as any, undefined, selectedDay);

  if (isLoading) {
    return <ScheduleSkeleton />;
  }
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentPad}>
      <Box style={styles.calendarWrap}>
        {/* 요일 헤더 */}
        <Box style={styles.calendarHeader}>
          {weekDays.map((d, idx) => (
            <Box key={d} style={styles.calendarHeaderCell}>
              <Typography
                style={[
                  styles.calendarHeaderText,
                  idx === 0 && styles.calendarTextRed,
                  idx === 6 && styles.calendarTextBlue,
                ]}
              >
                {d}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 달력 그리드 */}
        <Box style={styles.calendarGrid}>
          {days.map((cell, idx) => (
            <Box 
              key={`${cell.day || "empty"}-${idx}`} 
              style={[
                styles.calendarCell, 
                !cell.day && styles.calendarCellEmpty,
                (cell.day === selectedDay && cell.day !== 0) && styles.calendarCellSelected
              ]}
            >
              {cell.day !== 0 ? (
                <>
                  <Box style={styles.calendarCellTopRow}>
                    <Typography style={styles.calendarDayText}>{cell.day}</Typography>
                    {cell.hasGame && cell.location ? (
                      <Typography style={[styles.calendarLocationText, cell.location === "A" && styles.calendarLocationAway]}>
                        {cell.location}
                      </Typography>
                    ) : null}
                  </Box>

                  {cell.hasGame && cell.opponentShort ? (
                    <Box style={styles.calendarOpponentWrap}>
                      <Box style={[styles.opponentBadgeDummy, { backgroundColor: cell.opponentColor ?? theme.colors.team.fallback }]} />
                      <Typography style={styles.calendarOpponentText}>{cell.opponentShort}</Typography>
                    </Box>
                  ) : (
                    <Box style={styles.calendarEmptySpacer} />
                  )}

                  {cell.hasGame && cell.timeText ? (
                    <Typography style={styles.calendarTimeText}>{cell.timeText}</Typography>
                  ) : null}
                </>
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>
    </ScrollView>
  );
}

function useFakeRankingData() {
  return useMemo(() => {
    return [
      { rank: 1, team: { name: "LG 트윈스", shortName: "LG", subName: "트윈스", mascotEmoji: "👯", color: theme.colors.team.lg, backendCode: "LG" }, games: 144, win: 85, lose: 56, draw: 3, winRate: 0.603 },
      { rank: 2, team: { name: "한화 이글스", shortName: "한화", subName: "이글스", mascotEmoji: "🦅", color: theme.colors.team.hanwha, backendCode: "HH" }, games: 144, win: 83, lose: 57, draw: 4, winRate: 0.593 },
      { rank: 3, team: { name: "SSG 랜더스", shortName: "SSG", subName: "랜더스", mascotEmoji: "🛸", color: theme.colors.team.ssg, backendCode: "SK" }, games: 144, win: 75, lose: 65, draw: 4, winRate: 0.536 },
      { rank: 4, team: { name: "삼성 라이온즈", shortName: "삼성", subName: "라이온즈", mascotEmoji: "🦁", color: theme.colors.team.samsung, backendCode: "SS" }, games: 144, win: 74, lose: 68, draw: 2, winRate: 0.521 },
      { rank: 5, team: { name: "NC 다이노스", shortName: "NC", subName: "다이노스", mascotEmoji: "🦖", color: theme.colors.team.nc, backendCode: "NC" }, games: 144, win: 71, lose: 67, draw: 6, winRate: 0.514 },
      { rank: 6, team: { name: "KT 위즈", shortName: "KT", subName: "위즈", mascotEmoji: "🧙", color: theme.colors.team.kt, backendCode: "KT" }, games: 144, win: 71, lose: 68, draw: 5, winRate: 0.511 },
      { rank: 7, team: { name: "롯데 자이언츠", shortName: "롯데", subName: "자이언츠", mascotEmoji: "⚓", color: theme.colors.team.lotte, backendCode: "LT" }, games: 144, win: 66, lose: 72, draw: 6, winRate: 0.478 },
      { rank: 8, team: { name: "KIA 타이거즈", shortName: "KIA", subName: "타이거즈", mascotEmoji: "🐯", color: theme.colors.team.kia, backendCode: "HT" }, games: 144, win: 65, lose: 75, draw: 4, winRate: 0.464, isMyTeam: true },
      { rank: 9, team: { name: "두산 베어스", shortName: "두산", subName: "베어스", mascotEmoji: "🐻", color: theme.colors.team.doosan, backendCode: "OB" }, games: 144, win: 61, lose: 77, draw: 6, winRate: 0.442 },
      { rank: 10, team: { name: "키움 히어로즈", shortName: "키움", subName: "키움", mascotEmoji: "🦸", color: theme.colors.team.kiwoom, backendCode: "WO" }, games: 144, win: 47, lose: 93, draw: 4, winRate: 0.336 },
    ];
  }, []);
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
  filterSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  toggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.full,
    padding: LOCAL_LAYOUT.togglePadding,
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
    color: theme.colors.text.primary,
    minWidth: LOCAL_LAYOUT.dateMinWidth,
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
    fontSize: LOCAL_LAYOUT.dropdownLabelFontSize,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.kiaRed,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContentPad: {
    paddingBottom: theme.layout.common.bottomPadding,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  tableHeaderText: {
    fontSize: LOCAL_LAYOUT.headerLabelFontSize,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.bold,
    textAlign: "center",
  },
  colRank: { width: LOCAL_LAYOUT.rankNumberWidth },
  colTeam: { flex: 1, textAlign: "left", paddingLeft: theme.spacing.xl },
  colStat: { width: LOCAL_LAYOUT.statColWidth },
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
    width: LOCAL_LAYOUT.rankNumberWidth,
    textAlign: "center",
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
    height: theme.layout.common.standardItemHeight,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card,
  },
  myTeamRankingCard: {
    borderWidth: LOCAL_LAYOUT.myTeamBorderWidth,
    borderColor: theme.colors.brand.mint,
  },
  teamInfoArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  teamBadge: {
    width: LOCAL_LAYOUT.opponentBadgeSize,
    height: LOCAL_LAYOUT.opponentBadgeSize,
    borderRadius: theme.radius.full,
  },
  teamNameText: {
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
    width: LOCAL_LAYOUT.statColWidth,
    textAlign: "center",
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
    height: LOCAL_LAYOUT.calendarHeaderHeight,
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
    borderWidth: LOCAL_LAYOUT.calendarBorderWidth,
    borderColor: theme.colors.team.neutralLight,
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: LOCAL_LAYOUT.calendarCellHeight,
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
    fontSize: LOCAL_LAYOUT.calendarLocationFontSize,
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
    width: LOCAL_LAYOUT.opponentBadgeSize,
    height: LOCAL_LAYOUT.opponentBadgeSize,
    borderRadius: theme.radius.full,
    marginBottom: LOCAL_LAYOUT.opponentBadgeMarginBottom,
  },
  calendarOpponentText: {
    fontSize: LOCAL_LAYOUT.calendarOpponentFontSize,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  calendarEmptySpacer: {
    flex: 1,
  },
  calendarTimeText: {
    fontSize: LOCAL_LAYOUT.calendarTimeFontSize,
    color: theme.colors.brand.subtitle,
  },
  calendarCellSelected: {
    backgroundColor: theme.colors.brand.mintAlpha10,
    borderColor: theme.colors.brand.mint,
    borderWidth: 1,
  },
});
