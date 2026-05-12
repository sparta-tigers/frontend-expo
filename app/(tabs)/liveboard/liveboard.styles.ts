// app/(tabs)/liveboard/liveboard.styles.ts
import { StyleSheet } from "react-native";
import { theme } from "@/src/styles/theme";

/**
 * 라이브보드 전용 레이아웃 상수
 * Why: Figma 디자인 가이드의 고정 수치를 테마 토큰과 결합하여 관리.
 *      토큰에 없는 미세 조정 수치는 여기서 명시적으로 정의한다.
 */
export const LOCAL_LAYOUT = {
  dateCircleSize: 28,
  dotSize: 8,
  calendarPaddingH: theme.spacing.xxxl, // 30
  calendarRowGap: theme.spacing.xxs, // 2
  cardHeight: 100,
  cardRadius: 18,
  cardPaddingH: 19,
  cardPaddingV: theme.spacing.xs + 2, // 6
  cardGap: 5,
  teamBlockWidth: 73,
  teamLogoSize: 45,
  centerBlockWidth: 112,
  weatherIconSize: 15,
  navArrowPadding: theme.spacing.xs,
  matchListHorizontalPadding: theme.spacing.xxxl,
  matchListBottomPadding: theme.layout.dashboard.matchListBottomPadding,
  matchListGap: theme.spacing.xl,
  // 텍스트 수치 정규화
  calendarDayFontSize: 13,
  calendarDayLineHeight: 20,
  dateFontSize: 15,
  dateLineHeight: 24,
  retryBtnPaddingH: theme.spacing.xl, // 20
  retryBtnPaddingV: 10,
  retryBtnRadius: theme.radius.xxl, // 20
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
    fontSize: LOCAL_LAYOUT.calendarDayFontSize,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    lineHeight: LOCAL_LAYOUT.calendarDayLineHeight,
  },
  dateText: {
    fontSize: LOCAL_LAYOUT.dateFontSize,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
    lineHeight: LOCAL_LAYOUT.dateLineHeight,
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
    gap: theme.spacing.xs,
  },
  teamLogo: {
    marginBottom: 0,
  },
  teamNameText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
  },
  centerBlock: {
    width: LOCAL_LAYOUT.centerBlockWidth,
    gap: 0,
  },
  timeStadiumBlock: {
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.xs + 2, // 6
  },
  timeText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.team.neutralDark,
    textAlign: "center",
  },
  stadiumText: {
    fontSize: theme.typography.size.xxs,
    color: theme.colors.brand.subtitle,
    textAlign: "center",
  },
  weatherText: {
    fontSize: theme.typography.size.xxs,
    color: theme.colors.brand.mint,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: LOCAL_LAYOUT.retryBtnPaddingH,
    paddingVertical: LOCAL_LAYOUT.retryBtnPaddingV,
    borderRadius: LOCAL_LAYOUT.retryBtnRadius,
    backgroundColor: theme.colors.brand.mint,
  },
  retryBtnText: {
    fontSize: LOCAL_LAYOUT.calendarDayFontSize,
    color: theme.colors.background,
  },
});
