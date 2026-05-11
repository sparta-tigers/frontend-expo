// app/(tabs)/liveboard/liveboard.styles.ts
import { StyleSheet } from "react-native";
import { theme } from "@/src/styles/theme";

// 화면 전용 레이아웃 상수 (Figma 기준)
export const LOCAL_LAYOUT = {
  dateCircleSize: 28,
  dotSize: 8,
  calendarPaddingH: 30,
  calendarRowGap: 2,
  cardHeight: 100,
  cardRadius: 18,
  cardPaddingH: 19,
  cardPaddingV: 6,
  cardGap: 5,
  teamBlockWidth: 73,
  teamLogoSize: 45,
  centerBlockWidth: 112,
  weatherIconSize: 15,
  navArrowPadding: theme.spacing.xs,
  matchListHorizontalPadding: theme.spacing.xxxl,
  matchListBottomPadding: theme.layout.dashboard.matchListBottomPadding,
  matchListGap: theme.spacing.xl,
} as const;

export const styles = StyleSheet.create({
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
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.brand.mint,
  },
  retryBtnText: {
    fontSize: 13,
    color: theme.colors.background,
  },
});
