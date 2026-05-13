import { useMemo } from "react";
import { MatchSummary } from "@/src/features/match/types";
import { CalendarCellModel } from "@/src/features/home/types/calendar";

/**
 * 전역 달력 그리드 생성 엔진 (Deterministic)
 * 
 * Why: 
 * 1. MatchSummary 모델을 사용하여 UI에 필요한 모든 데이터를 Mapper로부터 완제품 형태로 전달받음.
 * 2. 훅 내부에서 findTeamMeta를 호출하지 않아 'Dumb Hook'을 유지함.
 * 
 * @param year - 대상 연도
 * @param month - 대상 월 (1-12)
 * @param schedule - 해당 월의 경기 일정 데이터 배열 (MatchSummary UI 모델)
 * @param today - 오늘 날짜 정보 (연, 월, 일)
 * @param selectedDay - 하이라이트할 특정 날짜 (선택 사항)
 * @returns 캘린더 셀 데이터 배열
 */
export const useCalendarGrid = (
  year: number,
  month: number,
  schedule: MatchSummary[],
  today?: { year: number; month: number; day: number },
  selectedDay?: number,
  attendanceMatchIds?: Set<number>
): (CalendarCellModel & { isToday: boolean })[] => {
  return useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // O(1) 접근을 위한 맵 변환
    const dayToGame = new Map<number, MatchSummary>();
    schedule.forEach((g) => dayToGame.set(g.day, g));

    const daysArray: (CalendarCellModel & { isToday: boolean })[] = [];

    // 1. 월 시작 전 빈 셀 (Padding)
    for (let i = 0; i < firstDay; i++) {
      daysArray.push({
        day: 0,
        hasGame: false,
        opponentShort: "",
        isSelected: false,
        isToday: false,
      });
    }

    // 2. 실제 날짜 데이터 매핑
    for (let d = 1; d <= daysInMonth; d++) {
      const game = dayToGame.get(d);
      
      // 오늘 여부 판별
      const isToday = 
        today?.year === year && 
        today?.month === month && 
        today?.day === d;

      // 상대팀 정보 결정 (내 위치에 따라 반대팀 선택)
      const opponent = game ? (game.location === "H" ? game.awayTeam : game.homeTeam) : null;

      daysArray.push({
        day: d,
        matchId: game?.matchId,
        hasGame: !!game,
        hasAttendance: game?.matchId ? attendanceMatchIds?.has(game.matchId) : false,
        opponentCode: opponent?.code,
        opponentShort: opponent?.meta.shortName || "", 
        isSelected: d === selectedDay,
        isToday: isToday, 
        location: game?.location,
        timeText: game?.startTime,
        opponentColor: opponent?.meta.color,
        opponentColorToken: opponent?.meta.colorToken,
      });
    }

    // 3. 그리드 정렬 (최소 5주 ~ 최대 6주)
    const totalCellsRequired = Math.ceil(daysArray.length / 7) * 7;
    const finalTotal = Math.max(totalCellsRequired, 35);
    
    while (daysArray.length < finalTotal) {
      daysArray.push({
        day: 0,
        hasGame: false,
        opponentShort: "",
        isSelected: false,
        isToday: false,
      });
    }

    return daysArray;
  }, [year, month, schedule, today, selectedDay, attendanceMatchIds]);
};
