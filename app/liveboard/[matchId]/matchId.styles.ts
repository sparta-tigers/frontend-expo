// app/liveboard/[matchId]/matchId.styles.ts
import { StyleSheet } from "react-native";
import { theme } from "@/src/styles/theme";

// 디자인 기준 섹션 수치 (Figma)
export const LIVE_SECTION_HEIGHT = 274;
const LEFT_BAR_WIDTH = 74;
const LEFT_BAR_LEFT = 13;
const PLAYER_AREA_LEFT = 102;
const PLAYER_AREA_TOP = 53;
const PLAYER_AREA_WIDTH = 290;
const PLAYER_AREA_HEIGHT = 223;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },

  // ── 라이브 섹션 (상단) ───────────────────────────────
  liveSection: {
    height: LIVE_SECTION_HEIGHT,
    overflow: "hidden",
    position: "relative",
  },
  stadiumBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.liveboard.stadiumBg,
  },
  eventBanner: {
    position: "absolute",
    top: 27,
    left: 120,
    paddingHorizontal: 32,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: theme.colors.brand.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  eventBannerText: {
    fontSize: 11,
    color: theme.colors.background,
    textAlign: "center",
    letterSpacing: -0.55,
  },

  // ── 좌측 바 ──────────────────────────────────────────
  leftBar: {
    position: "absolute",
    top: 0,
    left: LEFT_BAR_LEFT,
    width: LEFT_BAR_WIDTH,
    height: LIVE_SECTION_HEIGHT,
  },
  scoreRow: {
    position: "absolute",
    left: 0,
    width: LEFT_BAR_WIDTH,
    height: 30,
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  scoreAway: {
    top: 27,
    backgroundColor: theme.colors.liveboard.scoreAway,
  },
  scoreHome: {
    top: 57,
    backgroundColor: theme.colors.liveboard.scoreHome,
  },
  scoreTeamLabel: {
    fontSize: 10,
    color: theme.colors.background,
  },
  scoreValue: {
    fontSize: 20,
    color: theme.colors.background,
    letterSpacing: -1,
  },
  countBox: {
    position: "absolute",
    top: 97,
    left: 4,
    width: LEFT_BAR_WIDTH - 4,
    height: 165,
    borderRadius: 3,
    backgroundColor: theme.colors.liveboard.countBoxBg,
    padding: 6,
    gap: 4,
  },
  inningRow: {
    gap: 4,
  },
  inningText: {
    fontSize: 16,
    color: theme.colors.background,
    textAlign: "center",
  },
  baseDiamond: {
    position: "relative",
    width: 36,
    height: 36,
    marginLeft: 6,
  },
  base: {
    position: "absolute",
    width: 10,
    height: 10,
    backgroundColor: theme.colors.liveboard.baseIdle,
    transform: [{ rotate: "45deg" }],
  },
  baseSecond: { top: 0, left: 13 },
  baseFirst: { top: 13, left: 22 },
  baseThird: { top: 13, left: 4 },
  baseActive: {
    backgroundColor: theme.colors.liveboard.baseActive,
  },
  bsoRow: {
    gap: 2,
    marginTop: 2,
  },
  bsoLine: {
    gap: 4,
  },
  bsoLabel: {
    fontSize: 11,
    color: theme.colors.background,
    width: 10,
  },
  bsoDots: {
    gap: 2,
  },
  bsoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.liveboard.bsoDotIdle,
  },
  bsoDotBall: { backgroundColor: theme.colors.liveboard.bsoBall },
  bsoDotStrike: { backgroundColor: theme.colors.liveboard.bsoStrike },
  bsoDotOut: { backgroundColor: theme.colors.liveboard.bsoOut },
  pitcherBox: {
    marginTop: 4,
    gap: 2,
  },
  pitcherName: {
    fontSize: 11,
    color: theme.colors.background,
    textAlign: "center",
  },
  pitcherPitchLabel: {
    fontSize: 11,
    color: theme.colors.background,
    textAlign: "center",
  },
  pitcherPitchCount: {
    fontSize: 11,
    color: theme.colors.brand.mint,
  },

  // ── 선수 배치 영역 ────────────────────────────────────
  playerArea: {
    position: "absolute",
    top: PLAYER_AREA_TOP,
    left: PLAYER_AREA_LEFT,
    width: PLAYER_AREA_WIDTH,
    height: PLAYER_AREA_HEIGHT,
  },
  playerTag: {
    position: "absolute",
    width: 47,
    height: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playerTagDefender: {
    backgroundColor: theme.colors.liveboard.defender,
  },
  playerTagBatter: {
    backgroundColor: theme.colors.liveboard.batter,
  },
  playerTagRunner: {
    backgroundColor: theme.colors.liveboard.runner,
  },
  playerName: {
    fontSize: 9,
    color: theme.colors.background,
    textAlign: "center",
    lineHeight: 13,
  },
  playerNameRunner: {
    fontSize: 9,
    color: theme.colors.liveboard.runnerText,
    textAlign: "center",
    lineHeight: 13,
  },

  // ── 탭 바 ─────────────────────────────────────────────
  tabBar: {
    height: 30,
    paddingHorizontal: 33,
    backgroundColor: theme.colors.brand.background,
    shadowColor: theme.colors.team.kt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
  },
  tabItem: {
    width: 59,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 12,
    color: theme.colors.brand.inactive,
    textAlign: "center",
  },
  tabTextActive: {
    color: theme.colors.brand.mint,
  },

  // ── 채팅 패널 ────────────────────────────────────────
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 14,
    gap: 15,
  },
  bubbleRow: {
    gap: 2,
    maxWidth: "100%",
  },
  bubbleColumn: {
    gap: 2,
    maxWidth: 240,
  },
  bubbleAuthor: {
    fontSize: 13,
    color: theme.colors.team.neutralDark,
    paddingHorizontal: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: theme.colors.team.kt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5.25,
    elevation: 1,
  },
  bubbleOther: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleMine: {
    backgroundColor: theme.colors.brand.mint,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleTextOther: {
    fontSize: 14,
    color: theme.colors.team.neutralDark,
  },
  bubbleTextMine: {
    fontSize: 14,
    color: theme.colors.background,
  },
  bubbleTime: {
    fontSize: 10,
    color: theme.colors.brand.subtitle,
    paddingBottom: 4,
  },

  // ── 채팅 입력창 ──────────────────────────────────────
  chatInputWrap: {
    height: 66,
    paddingHorizontal: 12,
    paddingTop: 0,
    position: "relative",
  },
  chatInput: {
    height: 39,
    borderRadius: 15,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 17,
    shadowColor: theme.colors.team.kt,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  chatInputText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.team.neutralDark,
  },
  chatSendBtn: {
    position: "absolute",
    right: 24,
    top: 7,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: theme.colors.brand.mint,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── 라인업 패널 ──────────────────────────────────────
  lineupScroll: {
    flex: 1,
  },
  lineupContent: {
    paddingBottom: 30,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  chipInactive: {
    backgroundColor: theme.colors.card,
  },
  chipTextActive: {
    fontSize: 13,
    color: theme.colors.background,
  },
  chipTextInactive: {
    fontSize: 13,
    color: theme.colors.brand.inactive,
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

  // ── 구장날씨 패널 ────────────────────────────────────
  weatherScroll: {
    flex: 1,
  },
  weatherContent: {
    paddingBottom: 30,
  },
  weatherStatusBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.brand.mint,
  },
  weatherStatusText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
