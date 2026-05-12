import { useMemo } from "react";
import { MatchScheduleDto } from "@/src/features/match/types";
import { CalendarCellModel } from "@/src/features/home/types";
import { getTeamByBackendCode } from "@/src/utils/team";

/**
 * 전역 달력 그리드 생성 엔진 (Deterministic)
 * 
 * @param year - 대상 연도
 * @param month - 대상 월 (1-12)
 * @param schedule - 해당 월의 경기 일정 데이터 배열 (Match 공통 DTO)
 * @param today - 오늘 날짜 정보 (연, 월, 일)
 * @param selectedDay - 하이라이트할 특정 날짜 (선택 사항)
 * @returns 35개 또는 42개의 캘린더 셀 데이터 배열
 */
export const useCalendarGrid = (
  year: number,
  month: number,
  schedule: MatchScheduleDto[],
  today?: { year: number; month: number; day: number },
  selectedDay?: number,
  attendanceMatchIds?: Set<number> // 🚨 추가: 직관 기록이 있는 경기 ID 목록
): (CalendarCellModel & { isToday: boolean })[] => {
  return useMemo(() => {
    // 🚨 앙드레 카파시: 결정론적 그리드 생성
    // Why: 연/월/일정/오늘날짜 데이터가 동일하면 항상 동일한 UI 구조를 반환하여 리렌더링 최적화 보장.
    
    // month는 1-indexed이므로 Date 객체 생성 시 -1 필요
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // O(1) 접근을 위한 맵 변환
    const dayToGame = new Map<number, MatchScheduleDto>();
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
      // 백엔드 코드(HT, OB 등)를 통해 팀 정보 조회 (Safe Mapping)
      const opponentInfo = game?.opponentCode ? getTeamByBackendCode(game.opponentCode) : null;

      // 오늘 여부 판별 (연, 월, 일이 모두 일치해야 함)
      const isToday = 
        today?.year === year && 
        today?.month === month && 
        today?.day === d;

      daysArray.push({
        day: d,
        matchId: game?.matchId, // 🚨 추가
        hasGame: !!game,
        hasAttendance: game?.matchId ? attendanceMatchIds?.has(game.matchId) : false, // 🚨 추가
        opponentCode: game?.opponentCode,
        opponentShort: opponentInfo?.shortName ?? "", 
        isSelected: d === selectedDay,
        isToday: isToday, 
        location: game?.location,
        timeText: game?.timeText,
        opponentColor: undefined,
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
