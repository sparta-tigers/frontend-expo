import { useMemo } from "react";
import { theme } from "@/src/styles/theme";
import {
  TeamDto,
  MiniStatDto,
  RankingRowDto,
  LineupRowDto,
  CalendarGameDto,
} from "./types";

/**
 * 홈 화면 가짜 데이터 생성 훅
 *
 * Why: 실제 API 연동 전 홈 화면의 각 섹션(마이팀, 순위, 라인업, 일정)을 테스트하기 위한 데이터를 통합 제공하기 위함.
 * @returns 홈 화면에 필요한 목(Mock) 데이터 객체
 */
export function useFakeHomeData() {
  return useMemo(() => {
    const myTeam: TeamDto = { 
      name: "KIA 타이거즈", 
      shortName: "KIA", 
      subName: "타이거즈", 
      mascotEmoji: "🐯",
      color: theme.colors.team.kia
    };

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
        team: { name: "LG 트윈스", shortName: "LG", subName: "트윈스", mascotEmoji: "👯", color: theme.colors.team.lg },
        games: 144,
        win: 85,
        lose: 56,
        draw: 3,
        winRate: 0.603,
      },
      {
        rank: 2,
        team: { name: "한화 이글스", shortName: "한화", subName: "이글스", mascotEmoji: "🦅", color: theme.colors.team.hanwha },
        games: 144,
        win: 83,
        lose: 57,
        draw: 4,
        winRate: 0.593,
      },
      {
        rank: 3,
        team: { name: "SSG 랜더스", shortName: "SSG", subName: "랜더스", mascotEmoji: "🛸", color: theme.colors.team.ssg },
        games: 144,
        win: 75,
        lose: 65,
        draw: 4,
        winRate: 0.536,
      },
      {
        rank: 4,
        team: { name: "삼성 라이온즈", shortName: "삼성", subName: "라이온즈", mascotEmoji: "🦁", color: theme.colors.team.samsung },
        games: 144,
        win: 74,
        lose: 68,
        draw: 2,
        winRate: 0.521,
      },
      {
        rank: 5,
        team: { name: "NC 다이노스", shortName: "NC", subName: "다이노스", mascotEmoji: "🦖", color: theme.colors.team.nc },
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
