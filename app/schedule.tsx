import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * 대시보드 일정 상세 화면 (main_1 / main_2)
 *
 * - 연도별 토글: main_1(캘린더 그리드)
 * - 일자별 토글: main_2(리스트)
 *
 * Why: UI 틀을 먼저 고정하고 추후 API 연동으로 교체한다.
 */
export default function ScheduleScreen() {
  const params = useLocalSearchParams<{ view?: string; day?: string }>();
  const initialView = params.view === "day" ? "day" : "year";
  const initialDay = Number(params.day ?? "10");

  const [view, setView] = useState<"year" | "day">(initialView);
  const data = useFakeScheduleData(initialDay);

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.replace("/(tabs)/stadium")}
          activeOpacity={0.8}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>{"‹"}</Text>
        </TouchableOpacity>

        <View style={styles.toggleGroup}>
          <TogglePill
            label="연도별"
            selected={view === "year"}
            onPress={() => setView("year")}
          />
          <TogglePill
            label="일자별"
            selected={view === "day"}
            onPress={() => setView("day")}
          />
        </View>

        <View style={styles.topBarRightSpacer} />
      </View>

      {view === "year" ? (
        <YearCalendarView monthTitle={data.monthTitle} days={data.days} />
      ) : (
        <DayListView selectedDay={data.selectedDay} items={data.dayItems} />
      )}
    </SafeLayout>
  );
}

/**
 * 토글 버튼 DTO
 */
interface TogglePillProps {
  label: "연도별" | "일자별";
  selected: boolean;
  onPress: () => void;
}

function TogglePill({ label, selected, onPress }: TogglePillProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.togglePill, selected && styles.togglePillSelected]}
    >
      <Text style={[styles.togglePillText, selected && styles.togglePillTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * 캘린더 셀 모델
 */
interface ScheduleCalendarCellDto {
  day: number;
  hasGame: boolean;
  location?: "H" | "A";
  opponentShort: string;
  timeText?: string;
  isSelected: boolean;
}

/**
 * 연도별(캘린더) 뷰
 */
function YearCalendarView(props: {
  monthTitle: string;
  days: ScheduleCalendarCellDto[];
}) {
  const { monthTitle, days } = props;

  return (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={styles.contentScrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleText}>{monthTitle}</Text>
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
              // 달력의 빈칸(경기 없음)은 선택 불가로 둔다
              key={`${cell.day}-${idx}`}
              activeOpacity={0.85}
              disabled={!cell.hasGame}
              onPress={() => router.setParams({ view: "day", day: String(cell.day) })}
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
    </ScrollView>
  );
}

/**
 * 일자별(리스트) 아이템 DTO
 */
interface DayScheduleItemDto {
  timeText: string;
  title: string;
  subtitle: string;
  location: "H" | "A";
}

function DayListView(props: { selectedDay: number; items: DayScheduleItemDto[] }) {
  const { selectedDay, items } = props;

  return (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={styles.contentScrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleText}>{selectedDay}일 경기 일정</Text>
      </View>

      <View style={styles.dayList}>
        {items.map((item, idx) => (
          <View key={`${item.timeText}-${idx}`} style={styles.dayListItem}>
            <View style={styles.dayListTimeCol}>
              <Text style={styles.dayListTimeText}>{item.timeText}</Text>
              <Text style={styles.dayListLocationText}>{item.location}</Text>
            </View>
            <View style={styles.dayListTextCol}>
              <Text style={styles.dayListTitle}>{item.title}</Text>
              <Text style={styles.dayListSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/**
 * 일정 화면 전용 가짜 데이터 훅
 */
function useFakeScheduleData(initialDay: number) {
  return useMemo(() => {
    const monthTitle = "7월, 우리팀 경기 일정이에요";

    const schedule: {
      day: number;
      location?: "H" | "A";
      opponentShort: string;
      timeText?: string;
    }[] = [
        { day: 1, location: "H", opponentShort: "SSG", timeText: "18:30" },
        { day: 2, location: "H", opponentShort: "SSG", timeText: "18:30" },
        { day: 3, location: "H", opponentShort: "SSG", timeText: "18:30" },
        { day: 4, location: "H", opponentShort: "LOT", timeText: "18:30" },
        { day: 5, location: "H", opponentShort: "LOT", timeText: "18:30" },
        { day: 7, location: "H", opponentShort: "LOT", timeText: "18:30" },
        { day: 10, location: "A", opponentShort: "HH", timeText: "18:30" },
        { day: 18, location: "H", opponentShort: "NC", timeText: "18:30" },
        { day: 19, location: "H", opponentShort: "NC", timeText: "18:30" },
        { day: 22, location: "H", opponentShort: "LG", timeText: "18:30" },
        { day: 23, location: "H", opponentShort: "LG", timeText: "18:30" },
        { day: 24, location: "H", opponentShort: "LG", timeText: "18:30" },
        { day: 30, location: "H", opponentShort: "DOO", timeText: "18:30" },
        { day: 31, location: "H", opponentShort: "DOO", timeText: "18:30" },
      ];

    const dayToGame = new Map<number, (typeof schedule)[number]>();
    schedule.forEach((g) => dayToGame.set(g.day, g));

    const days: ScheduleCalendarCellDto[] = Array.from({ length: 35 }, (_, idx) => {
      const day = idx + 1;
      const game = dayToGame.get(day);

      const base: ScheduleCalendarCellDto = {
        day,
        hasGame: !!game,
        opponentShort: game?.opponentShort ?? "",
        isSelected: day === initialDay,
      };

      if (game?.location) base.location = game.location;
      if (game?.timeText) base.timeText = game.timeText;

      return base;
    });

    const selectedDay = initialDay;
    const selectedGame = dayToGame.get(selectedDay);

    const dayItems: DayScheduleItemDto[] = selectedGame
      ? [
          {
            timeText: selectedGame.timeText ?? "18:30",
            title: `KIA vs ${selectedGame.opponentShort}`,
            subtitle: "챔피언스필드 (가짜 데이터)",
            location: selectedGame.location ?? "H",
          },
          {
            timeText: "19:00",
            title: "프리뷰/선발 정보",
            subtitle: "라인업/선발투수 (가짜 데이터)",
            location: selectedGame.location ?? "H",
          },
        ]
      : [
          {
            timeText: "—",
            title: "선택한 날짜에 경기가 없어요",
            subtitle: "다른 날짜를 선택해보세요 (가짜 데이터)",
            location: "H",
          },
        ];

    return { monthTitle, days, selectedDay, dayItems };
  }, [initialDay]);
}

const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  topBar: {
    height: theme.layout.auth.headerHeight,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: theme.colors.brand.background,
  },
  backButton: {
    width: theme.layout.auth.headerIconBox,
    height: theme.layout.auth.headerIconBox,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.team.neutralDark,
  },
  topBarRightSpacer: {
    width: theme.layout.auth.headerIconBox,
    height: theme.layout.auth.headerIconBox,
  },
  toggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    padding: theme.spacing.xs,
    ...theme.shadow.card,
  },
  togglePill: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
  },
  togglePillSelected: {
    backgroundColor: theme.colors.brand.mint,
  },
  togglePillText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.brand.subtitle,
  },
  togglePillTextSelected: {
    color: theme.colors.background,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
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
    width: theme.layout.dashboard.calendarCellWidth,
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
  dayList: {
    paddingHorizontal: theme.layout.dashboard.screenPaddingHorizontal,
    gap: theme.spacing.md,
  },
  dayListItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.dashboardCard,
    padding: theme.spacing.lg,
    flexDirection: "row",
    gap: theme.spacing.lg,
    ...theme.shadow.card,
  },
  dayListTimeCol: {
    width: theme.spacing.xxl * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  dayListTimeText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
  },
  dayListLocationText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.brand.mint,
    fontWeight: theme.typography.weight.bold,
  },
  dayListTextCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  dayListTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.team.neutralDark,
  },
  dayListSubtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.brand.subtitle,
  },
});

