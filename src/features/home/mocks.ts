import { useMemo } from "react";
import { TEAM_DATA } from "@/src/utils/team";
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
 * @param myTeamId - 현재 선택된 응원팀 ID (nullable)
 * @returns 홈 화면에 필요한 목(Mock) 데이터 객체
 */
export function useFakeHomeData(myTeamId: string | null) {
  return useMemo(() => {
    // 1. 응원팀 정보 (없으면 KIA 기본)
    const activeTeamId = myTeamId || "KIA";
    const myTeam: TeamDto = TEAM_DATA[activeTeamId] || TEAM_DATA["KIA"];

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

    // 2. 전체 구단 가공 (순위 데이터 시뮬레이션)
    const allRankings: RankingRowDto[] = [
      { rank: 1, team: TEAM_DATA["LG"], games: 144, win: 85, lose: 56, draw: 3, winRate: 0.603 },
      { rank: 2, team: TEAM_DATA["HANWHA"], games: 144, win: 83, lose: 57, draw: 4, winRate: 0.593 },
      { rank: 3, team: TEAM_DATA["SSG"], games: 144, win: 75, lose: 65, draw: 4, winRate: 0.536 },
      { rank: 4, team: TEAM_DATA["SAMSUNG"], games: 144, win: 74, lose: 68, draw: 2, winRate: 0.521 },
      { rank: 5, team: TEAM_DATA["NC"], games: 144, win: 71, lose: 67, draw: 6, winRate: 0.514 },
      { rank: 6, team: TEAM_DATA["KT"], games: 144, win: 71, lose: 68, draw: 5, winRate: 0.511 },
      { rank: 7, team: TEAM_DATA["LOTTE"], games: 144, win: 66, lose: 72, draw: 6, winRate: 0.478 },
      { rank: 8, team: TEAM_DATA["KIA"], games: 144, win: 65, lose: 75, draw: 4, winRate: 0.464 },
      { rank: 9, team: TEAM_DATA["DOOSAN"], games: 144, win: 61, lose: 77, draw: 6, winRate: 0.442 },
      { rank: 10, team: TEAM_DATA["KIWOOM"], games: 144, win: 47, lose: 93, draw: 4, winRate: 0.336 },
    ];

    // 3. 순위 요약 데이터 필터링 로직
    // - 상위 5위는 무조건 노출
    // - 내 응원팀이 5위 안에 있으면 해당 행 강조
    // - 내 응원팀이 5위 밖이면 5위 다음에 내 팀 행 추가하여 노출
    const displayRanking: RankingRowDto[] = allRankings.slice(0, 5).map(row => ({
      ...row,
      isMyTeam: row.team.shortName === myTeam.shortName
    }));

    const isMyTeamInTop5 = displayRanking.some(row => row.isMyTeam);

    if (!isMyTeamInTop5) {
      const myTeamRankingRow = allRankings.find(row => row.team.shortName === myTeam.shortName);
      if (myTeamRankingRow) {
        displayRanking.push({ ...myTeamRankingRow, isMyTeam: true });
      }
    }

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
      rankingSummary: displayRanking,
      todayLineup,
      monthSchedule,
    };
  }, [myTeamId]);
}
