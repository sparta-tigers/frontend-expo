import { useMemo } from "react";
import { MatchScheduleDto } from "@/src/features/match/types";
import { CalendarCellModel } from "@/src/features/home/types";

/**
 * 전역 달력 그리드 생성 엔진 (Deterministic)
 * 
 * @param year - 대상 연도
 * @param month - 대상 월 (0-11)
 * @param schedule - 해당 월의 경기 일정 데이터 배열 (Match 공통 DTO)
 * @param todayDay - 오늘 날짜 (1-31, 결정론적 렌더링을 위해 외부에서 주입)
 * @param selectedDay - 하이라이트할 특정 날짜 (선택 사항)
 * @returns 35개 또는 42개의 캘린더 셀 데이터 배열
 */
export const useCalendarGrid = (
  year: number,
  month: number,
  schedule: MatchScheduleDto[],
  todayDay?: number,
  selectedDay?: number
): (CalendarCellModel & { isToday: boolean })[] => {
  return useMemo(() => {
    // 🚨 앙드레 카파시: 결정론적 그리드 생성
    // Why: 연/월/일정/오늘날짜 데이터가 동일하면 항상 동일한 UI 구조를 반환하여 리렌더링 최적화 보장.
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
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
      daysArray.push({
        day: d,
        hasGame: !!game,
        opponentShort: game?.opponentName ?? "", // DTO의 명칭 사용
        isSelected: d === selectedDay,
        isToday: d === todayDay, // 외부에서 주입받은 todayDay로 판단
        location: game?.location,
        timeText: game?.timeText,
        opponentColor: undefined, // 테마 컬러는 프론트엔드 유틸에서 팀 코드로 매핑하므로 제거
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
  }, [year, month, schedule, todayDay, selectedDay]);
};
