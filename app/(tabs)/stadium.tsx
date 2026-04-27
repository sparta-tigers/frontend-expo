import { SafeLayout } from "@/components/ui/safe-layout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { theme } from "@/src/styles/theme";
import { type RelativePathString, router } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * 대시보드 화면 (`main_0`)
 *
 * Why: 실제 API 연동 전에 UI 골격을 먼저 고정하고, 이후 데이터 연동을 단계적으로 진행한다.
 * 모든 데이터는 "가짜 데이터"로만 렌더링한다.
 */
export default function StadiumScreen() {
  const data = useFakeDashboardData();

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MyTeamSection
          userNickname={data.userNickname}
          daysInSchool={data.daysInSchool}
          myTeam={data.myTeam}
          stats={data.myTeamStats}
          onPressChangeTeam={() => {}}
        />

        <RankingSummarySection ranking={data.rankingSummary} />

        <LineupSection lineup={data.todayLineup} />

        <ScheduleSection schedule={data.monthSchedule} />
      </ScrollView>
    </SafeLayout>
  );
}

/**
 * 팀 정보 DTO
 *
 * Interface = Java의 DTO
 */
interface TeamDto {
  /** 팀 표시명 */
  name: string;
  /** 팀 단축명(아이콘 대체용) */
  shortName: string;
}

/**
 * 대시보드 상단 미니 카드 DTO
 *
 * Why: 숫자/라벨/아이콘을 한 덩어리로 묶어 재사용 가능한 UI로 만든다.
 */
interface MiniStatDto {
  /** 카드의 의미를 구분하는 키 */
  key: "visits" | "alarms" | "remainingGames";
  /** 큰 숫자 텍스트 */
  valueText: string;
  /** 하단 라벨 */
  label: string;
  /** 아이콘 심볼 */
  iconName: React.ComponentProps<typeof IconSymbol>["name"];
  /** 배경톤(가짜 데이터 UI용) */
  tone: "pink" | "yellow" | "green";
}

/**
 * 순위 행 DTO
 */
interface RankingRowDto {
  rank: number;
  team: TeamDto;
  games: number;
  win: number;
  lose: number;
  draw: number;
  winRate: number;
  /** 내 팀 강조 여부 */
  isMyTeam?: boolean;
}

/**
 * 라인업 행 DTO
 */
interface LineupRowDto {
  order: number;
  name: string;
  position: string;
}

/**
 * 달력 경기 DTO
 */
interface CalendarGameDto {
  day: number;
  /** H/A 표시 (Home/Away) */
  location?: "H" | "A";
  opponentShort: string;
  timeText?: string;
  isSelected?: boolean;
}

/**
 * 대시보드 화면용 가짜 데이터 훅
 *
 * Why: API 연동 전 UI 개발을 위한 단일 출처로, 이후 query/SDK로 대체된다.
 */
function useFakeDashboardData() {
  return useMemo(() => {
    const myTeam: TeamDto = { name: "KIA 타이거즈", shortName: "KIA" };

    const myTeamStats: MiniStatDto[] = [
      {
        key: "visits",
        valueText: "13회",
        label: "올해 직관횟수",
        iconName: "chart.bar.fill",
        tone: "pink",
      },
      {
        key: "alarms",
        valueText: "2개",
        label: "현재 등록된 알람",
        iconName: "clock.fill",
        tone: "yellow",
      },
      {
        key: "remainingGames",
        valueText: "31경기",
        label: "남은 경기수",
        iconName: "star.fill",
        tone: "green",
      },
    ];

    const rankingSummary: RankingRowDto[] = [
      {
        rank: 1,
        team: { name: "LG 트윈스", shortName: "LG" },
        games: 144,
        win: 85,
        lose: 56,
        draw: 3,
        winRate: 0.603,
      },
      {
        rank: 2,
        team: { name: "한화 이글스", shortName: "HH" },
        games: 144,
        win: 83,
        lose: 57,
        draw: 4,
        winRate: 0.593,
      },
      {
        rank: 3,
        team: { name: "SSG 랜더스", shortName: "SSG" },
        games: 144,
        win: 75,
        lose: 65,
        draw: 4,
        winRate: 0.536,
      },
      {
        rank: 4,
        team: { name: "삼성 라이온즈", shortName: "SS" },
        games: 144,
        win: 74,
        lose: 68,
        draw: 2,
        winRate: 0.521,
      },
      {
        rank: 5,
        team: { name: "NC 다이노스", shortName: "NC" },
        games: 144,
        win: 71,
        lose: 67,
        draw: 6,
        winRate: 0.514,
      },
      {
        rank: 8,
        team: myTeam,
        games: 144,
        win: 65,
        lose: 75,
        draw: 4,
        winRate: 0.464,
        isMyTeam: true,
      },
    ];

    const todayLineup: LineupRowDto[] = [
      { order: 1, name: "김도영", position: "3B" },
      { order: 2, name: "소크라테스", position: "CF" },
      { order: 3, name: "김선빈", position: "2B" },
      { order: 4, name: "나성범", position: "RF" },
      { order: 5, name: "최형우", position: "DH" },
      { order: 6, name: "황대인", position: "1B" },
      { order: 7, name: "김석환", position: "LF" },
      { order: 8, name: "김민식", position: "C" },
      { order: 9, name: "박찬호", position: "SS" },
      { order: 10, name: "양현종", position: "P" },
    ];

    const monthSchedule: CalendarGameDto[] = [
      { day: 1, location: "H", opponentShort: "SSG", timeText: "18:30" },
      { day: 2, location: "H", opponentShort: "SSG", timeText: "18:30" },
      { day: 3, location: "H", opponentShort: "SSG", timeText: "18:30" },
      { day: 4, location: "H", opponentShort: "LOT", timeText: "18:30" },
      { day: 5, location: "H", opponentShort: "LOT", timeText: "18:30" },
      { day: 7, location: "H", opponentShort: "LOT", timeText: "18:30" },
      { day: 10, location: "A", opponentShort: "HH", timeText: "18:30", isSelected: true },
      { day: 18, location: "H", opponentShort: "NC", timeText: "18:30" },
      { day: 19, location: "H", opponentShort: "NC", timeText: "18:30" },
      { day: 22, location: "H", opponentShort: "LG", timeText: "18:30" },
      { day: 23, location: "H", opponentShort: "LG", timeText: "18:30" },
      { day: 24, location: "H", opponentShort: "LG", timeText: "18:30" },
      { day: 30, location: "H", opponentShort: "DOO", timeText: "18:30" },
      { day: 31, location: "H", opponentShort: "DOO", timeText: "18:30" },
    ];

    return {
      userNickname: "타이거즈조아🐯",
      daysInSchool: 1378,
      myTeam,
      myTeamStats,
      rankingSummary,
      todayLineup,
      monthSchedule,
    };
  }, []);
}

/**
 * 상단 "MY TEAM" 섹션
 */
function MyTeamSection(props: {
  userNickname: string;
  daysInSchool: number;
  myTeam: TeamDto;
  stats: MiniStatDto[];
  onPressChangeTeam: () => void;
}) {
  const { userNickname, daysInSchool, myTeam, stats, onPressChangeTeam } = props;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderLabel}>MY TEAM</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onPressChangeTeam}
          style={styles.changeTeamButton}
        >
          <Text style={styles.changeTeamButtonText}>응원팀 변경</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.myTeamCard}>
        <View style={styles.myTeamTitleRow}>
          <Text style={styles.myTeamNicknameText}>{userNickname}</Text>
          <Text style={styles.myTeamSubText}>님,</Text>
          <Text style={styles.myTeamSubText}>입학한지 </Text>
          <Text style={styles.myTeamDaysText}>{daysInSchool}</Text>
          <Text style={styles.myTeamSubText}>일째 !</Text>
        </View>

        <View style={styles.myTeamStatsRow}>
          {stats.map((item) => (
            <MiniStatCard key={item.key} item={item} />
          ))}

          <View style={styles.mascotBox}>
            <Text style={styles.mascotEmoji}>🐯</Text>
            <Text style={styles.mascotTeamText}>{myTeam.shortName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MiniStatCard(props: { item: MiniStatDto }) {
  const { item } = props;
  const toneStyle =
    item.tone === "pink"
      ? styles.miniStatTonePink
      : item.tone === "yellow"
        ? styles.miniStatToneYellow
        : styles.miniStatToneGreen;

  const iconColor =
    item.tone === "pink"
      ? theme.colors.team.kiaRed
      : item.tone === "yellow"
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <View style={[styles.miniStatCard, toneStyle]}>
      <View style={styles.miniStatIconRow}>
        <View style={styles.miniStatIconBadge}>
          <IconSymbol
            size={theme.typography.size.xs}
            name={item.iconName}
            color={iconColor}
          />
        </View>
      </View>
      <Text style={styles.miniStatValue}>{item.valueText}</Text>
      <Text style={styles.miniStatLabel}>{item.label}</Text>
    </View>
  );
}

/**
 * 순위 요약 섹션
 */
function RankingSummarySection(props: { ranking: RankingRowDto[] }) {
  const { ranking } = props;
  const myTeamRank = ranking.find((r) => r.isMyTeam)?.rank ?? 0;

  return (
    <View style={styles.section}>
      <Text style={styles.centerTitleText}>
        오늘의 우리 팀 순위는 {myTeamRank}위예요
      </Text>

      <View style={styles.rankingList}>
        {ranking.map((row) => (
          <RankingRow key={row.rank} row={row} />
        ))}
      </View>
    </View>
  );
}

function RankingRow(props: { row: RankingRowDto }) {
  const { row } = props;
  const isMyTeam = row.isMyTeam === true;

  return (
    <View style={styles.rankingRowWrap}>
      <Text style={[styles.rankingRankText, isMyTeam && styles.rankingRankMyTeam]}>
        {row.rank}
      </Text>

      <View style={[styles.rankingPill, isMyTeam && styles.rankingPillMyTeam]}>
        <View style={styles.rankingTeamArea}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>{row.team.shortName}</Text>
          </View>
          <Text style={[styles.rankingTeamName, isMyTeam && styles.rankingTeamNameMyTeam]}>
            {row.team.name}
          </Text>
        </View>

        <View style={styles.rankingStatArea}>
          <Text style={styles.rankingStatText}>{row.games}</Text>
          <Text style={styles.rankingStatText}>{row.win}</Text>
          <Text style={styles.rankingStatText}>{row.lose}</Text>
          <Text style={styles.rankingStatText}>{row.draw}</Text>
          <Text style={styles.rankingStatText}>{row.winRate.toFixed(3)}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * 라인업 섹션
 */
function LineupSection(props: { lineup: LineupRowDto[] }) {
  const { lineup } = props;

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleText}>오늘, 승리를 이끌 라인업이예요</Text>
      </View>

      <View style={styles.lineupList}>
        {lineup.map((row) => (
          <View key={row.order} style={styles.lineupRow}>
            <View style={styles.lineupNumberArea}>
              <Text style={styles.lineupNumberText}>{row.order}</Text>
              <View style={styles.lineupDivider} />
            </View>
            <Text style={styles.lineupNameText}>{row.name}</Text>
            <Text style={styles.lineupPosText}>{row.position}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * 일정 섹션
 */
function ScheduleSection(props: { schedule: CalendarGameDto[] }) {
  const { schedule } = props;
  const days = buildCalendarDays(schedule);

  return (
    <View style={[styles.section, styles.sectionBottomPad]}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleText}>7월, 우리팀 경기 일정이에요</Text>
      </View>

      <View style={styles.calendarWrap}>
        <View style={styles.calendarHeader}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <View key={d} style={styles.calendarHeaderCell}>
              <Text
                style={[
                  styles.calendarHeaderText,
                  (d === "일" || d === "토") && styles.calendarHeaderTextAccent,
                ]}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((cell, idx) => (
            <TouchableOpacity
              key={`${cell.day}-${idx}`}
              activeOpacity={0.85}
              disabled={!cell.hasGame}
              onPress={() =>
                router.push(
                  `../schedule?view=year&day=${cell.day}` as RelativePathString,
                )
              }
              style={styles.calendarCell}
            >
              <View style={styles.calendarCellTopRow}>
                <Text style={styles.calendarDayText}>{cell.day}</Text>
                {cell.location ? (
                  <Text style={styles.calendarLocationText}>{cell.location}</Text>
                ) : (
                  <View style={styles.calendarLocationSpacer} />
                )}
              </View>

              {cell.hasGame ? (
                <View
                  style={[
                    styles.calendarOpponentBadge,
                    cell.isSelected && styles.calendarOpponentBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarOpponentText,
                      cell.isSelected && styles.calendarOpponentTextSelected,
                    ]}
                  >
                    {cell.opponentShort}
                  </Text>
                </View>
              ) : (
                <View style={styles.calendarEmptySpacer} />
              )}

              {cell.timeText ? (
                <Text style={styles.calendarTimeText}>{cell.timeText}</Text>
              ) : (
                <View style={styles.calendarTimeSpacer} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * 달력 그리드용 셀 모델
 */
type CalendarCellModel = {
  day: number;
  hasGame: boolean;
  location?: "H" | "A";
  opponentShort: string;
  timeText?: string;
  isSelected: boolean;
};

/**
 * 달력 셀 데이터 생성
 *
 * Why: 실제 API 연동 시에도 "캘린더 UI가 요구하는 shape"는 그대로 유지된다.
 */
function buildCalendarDays(schedule: CalendarGameDto[]): CalendarCellModel[] {
  const MAX_CELLS = 35;
  const dayToGame = new Map<number, CalendarGameDto>();
  schedule.forEach((g) => dayToGame.set(g.day, g));

  return Array.from({ length: MAX_CELLS }, (_, idx) => {
    const day = idx + 1;
    const game = dayToGame.get(day);
    const base: CalendarCellModel = {
      day,
      hasGame: !!game,
      opponentShort: game?.opponentShort ?? "",
      isSelected: game?.isSelected === true,
    };

    if (game?.location) {
      base.location = game.location;
    }

    if (game?.timeText) {
      base.timeText = game.timeText;
    }

    return base;
  });
}

const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    paddingHorizontal: theme.layout.dashboard.screenPaddingHorizontal,
    marginTop: theme.layout.dashboard.sectionGap,
  },
  sectionBottomPad: {
    paddingBottom: theme.layout.dashboard.sectionGap,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  sectionHeaderLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.brand.subtitle,
    letterSpacing: -0.2,
  },
  changeTeamButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.brand.subtitle,
    borderRadius: theme.radius.dashboardCard,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  changeTeamButtonText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.brand.subtitle,
  },
  myTeamCard: {
    height: theme.layout.dashboard.myTeamCardHeight,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.dashboardCard,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  myTeamTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  myTeamNicknameText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  myTeamDaysText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
  },
  myTeamSubText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.brand.subtitle,
  },
  myTeamStatsRow: {
    flex: 1,
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  miniStatCard: {
    width: theme.layout.dashboard.myTeamMiniCardSize,
    height: theme.layout.dashboard.myTeamMiniCardHeight,
    borderRadius: theme.radius.dashboardCard,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    justifyContent: "space-between",
  },
  miniStatTonePink: {
    backgroundColor: theme.colors.dashboard.statTonePink,
  },
  miniStatToneYellow: {
    backgroundColor: theme.colors.dashboard.statToneYellow,
  },
  miniStatToneGreen: {
    backgroundColor: theme.colors.dashboard.statToneGreen,
  },
  miniStatIconRow: {
    flexDirection: "row",
  },
  miniStatIconBadge: {
    width: theme.typography.size.md,
    height: theme.typography.size.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  miniStatValue: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
  },
  miniStatLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.team.neutralDark,
  },
  mascotBox: {
    width: theme.layout.dashboard.myTeamMascotBox,
    height: theme.layout.dashboard.myTeamMascotBox,
    borderRadius: theme.radius.dashboardCard,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  mascotEmoji: {
    fontSize: theme.typography.size.xl,
  },
  mascotTeamText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.size.xs,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.medium,
  },
  centerTitleText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  rankingList: {
    gap: theme.spacing.sm,
  },
  rankingRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  rankingRankText: {
    width: theme.spacing.xxl,
    textAlign: "center",
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.brand.subtitle,
  },
  rankingRankMyTeam: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.brand.mint,
  },
  rankingPill: {
    flex: 1,
    height: theme.layout.dashboard.rankingRowHeight,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...theme.shadow.card,
  },
  rankingPillMyTeam: {
    height: theme.layout.dashboard.rankingRowHeightActive,
    borderWidth: theme.layout.dashboard.rankingMyTeamBorderWidth,
    borderColor: theme.colors.brand.mint,
  },
  rankingTeamArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    width: theme.layout.dashboard.myTeamMiniCardSize * 2,
  },
  teamBadge: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  teamBadgeText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.bold,
  },
  rankingTeamName: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
  },
  rankingTeamNameMyTeam: {
    color: theme.colors.brand.mint,
  },
  rankingStatArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  rankingStatText: {
    width: theme.spacing.xxl,
    fontSize: theme.typography.size.xs,
    color: theme.colors.brand.subtitle,
    textAlign: "center",
  },
  sectionTitleRow: {
    height: theme.layout.dashboard.sectionTitleHeight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitleText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
  },
  lineupList: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  lineupRow: {
    width: theme.layout.dashboard.lineupRowWidth,
    height: theme.layout.dashboard.lineupRowHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
    justifyContent: "center",
  },
  lineupNumberArea: {
    position: "absolute",
    left: theme.spacing.lg,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  lineupNumberText: {
    width: theme.spacing.lg,
    textAlign: "center",
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.kiaRed,
  },
  lineupDivider: {
    width: StyleSheet.hairlineWidth,
    height: "80%",
    backgroundColor: theme.colors.team.neutralLight,
  },
  lineupNameText: {
    textAlign: "center",
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
  },
  lineupPosText: {
    position: "absolute",
    right: theme.spacing.lg,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.kiaRed,
  },
  calendarWrap: {
    width: theme.layout.dashboard.calendarWidth,
    alignSelf: "center",
  },
  calendarHeader: {
    height: theme.layout.dashboard.calendarHeaderHeight,
    backgroundColor: theme.colors.team.neutralLight,
    borderTopLeftRadius: theme.layout.dashboard.calendarRadius,
    borderTopRightRadius: theme.layout.dashboard.calendarRadius,
    flexDirection: "row",
    overflow: "hidden",
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
  calendarHeaderTextAccent: {
    color: theme.colors.brand.mint,
  },
  calendarGrid: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.layout.dashboard.calendarRadius,
    borderBottomRightRadius: theme.layout.dashboard.calendarRadius,
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.team.neutralLight,
  },
  calendarCell: {
    width: theme.layout.dashboard.calendarCellWidth,
    height: theme.layout.dashboard.calendarCellHeight,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.team.neutralLight,
    padding: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarCellTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarDayText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.brand.subtitle,
    fontWeight: theme.typography.weight.medium,
  },
  calendarLocationText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.brand.mint,
    fontWeight: theme.typography.weight.bold,
  },
  calendarLocationSpacer: {
    width: theme.spacing.lg,
    height: theme.spacing.lg,
  },
  calendarOpponentBadge: {
    width: theme.spacing.xxl,
    height: theme.spacing.xl,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarOpponentBadgeSelected: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.brand.mint,
  },
  calendarOpponentText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.team.neutralDark,
    fontWeight: theme.typography.weight.bold,
  },
  calendarOpponentTextSelected: {
    color: theme.colors.brand.mint,
  },
  calendarEmptySpacer: {
    height: theme.spacing.xl,
  },
  calendarTimeText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.brand.subtitle,
  },
  calendarTimeSpacer: {
    height: theme.spacing.md,
  },
});
