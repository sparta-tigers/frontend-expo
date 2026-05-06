import { useMemo } from "react";
import { CalendarCellModel, CalendarGameDto } from "@/src/features/home/types";

/**
 * 전역 달력 그리드 생성 엔진 (Deterministic)
 * 
 * @param year - 대상 연도
 * @param month - 대상 월 (0-11)
 * @param schedule - 해당 월의 경기 일정 데이터 배열
 * @param selectedDay - 하이라이트할 특정 날짜 (선택 사항)
 * @returns 35개 또는 42개의 캘린더 셀 데이터 배열
 */
export const useCalendarGrid = (
  year: number,
  month: number,
  schedule: CalendarGameDto[],
  selectedDay?: number
): CalendarCellModel[] => {
  return useMemo(() => {
    // 🚨 앙드레 카파시: 결정론적 그리드 생성
    // Why: 연/월/일정 데이터가 동일하면 항상 동일한 UI 구조를 반환하여 리렌더링 최적화 보장.
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // O(1) 접근을 위한 맵 변환
    const dayToGame = new Map<number, CalendarGameDto>();
    schedule.forEach((g) => dayToGame.set(g.day, g));

    const daysArray: CalendarCellModel[] = [];

    // 1. 월 시작 전 빈 셀 (Padding)
    for (let i = 0; i < firstDay; i++) {
      daysArray.push({
        day: 0,
        hasGame: false,
        opponentShort: "",
        isSelected: false,
      });
    }

    // 2. 실제 날짜 데이터 매핑
    for (let d = 1; d <= daysInMonth; d++) {
      const game = dayToGame.get(d);
      daysArray.push({
        day: d,
        hasGame: !!game,
        opponentShort: game?.opponentShort ?? "",
        isSelected: d === selectedDay || game?.isSelected === true,
        location: game?.location,
        timeText: game?.timeText,
        opponentColor: game?.opponentColor,
      });
    }

    // 3. 그리드 정렬 (최소 5주 ~ 최대 6주)
    // Why: 달력의 높이가 월마다 바뀌어 레이아웃이 튀는 것을 방지하기 위해 
    // 최소 35칸(5주)을 보장하고, 6주가 필요한 경우 42칸으로 확장.
    const totalCellsRequired = Math.ceil(daysArray.length / 7) * 7;
    const finalTotal = Math.max(totalCellsRequired, 35);
    
    while (daysArray.length < finalTotal) {
      daysArray.push({
        day: 0,
        hasGame: false,
        opponentShort: "",
        isSelected: false,
      });
    }

    return daysArray;
  }, [year, month, schedule, selectedDay]);
};
