import { useAuth } from "@/context/AuthContext";
import { useInfiniteMyAttendances } from "@/src/features/match-attendance/queries";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { useTicketAlarms } from "@/src/features/ticket-alarm/hooks/useTicketAlarm";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";
import { LeagueType } from "@/src/shared/types/match";
import { ThemeColorPath } from "@/src/shared/types/theme";
import {
  getCurrentDay,
  getCurrentMonth,
  getCurrentYear,
  getRelativeMonth,
} from "@/src/utils/date";
import { findTeamMeta, isValidTeamCode } from "@/src/utils/team";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";

/**
 * useScheduleScreen Facade Hook
 *
 * Why: 경기 일정 화면의 복잡한 캘린더 로직, 다중 데이터 소스 패칭,
 * 그리고 맵 변환 최적화를 하나의 파사드 인터페이스로 캡슐화함.
 * 데이터 변경 시에만 Map을 재계산하도록 useMemo를 철저히 활용함.
 */
const PAGINATION_CONFIG = {
  attendancesPageSize: 100,
  ticketAlarmsPage: 1,
  ticketAlarmsPageSize: 50,
} as const;

export const useScheduleScreen = () => {
  const { myTeam } = useAuth();
  const activeTeamCode = myTeam && isValidTeamCode(myTeam) ? myTeam : "KIA";

  // 1. [SSOT] URL 파라미터 기반 상태 관리
  const params = useLocalSearchParams<{
    year?: string;
    month?: string;
    leagueType?: string;
    from?: string;
  }>();

  const year = useMemo(
    () => (params.year ? parseInt(params.year) : getCurrentYear()),
    [params.year],
  );
  const month = useMemo(
    () => (params.month ? parseInt(params.month) : getCurrentMonth()),
    [params.month],
  );
  const leagueType = (params.leagueType as LeagueType) || "REGULAR";
  const from = params.from;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 2. [PERF] 구단 데이터 메모이제이션
  const activeTeam = useMemo(
    () => findTeamMeta(activeTeamCode),
    [activeTeamCode],
  );
  const activeTeamColorPath = useMemo(
    () => `team.${activeTeam?.colorToken || "fallback"}` as ThemeColorPath,
    [activeTeam?.colorToken],
  );

  const today = useMemo(
    () => ({
      year: getCurrentYear(),
      month: getCurrentMonth(),
      day: getCurrentDay(),
    }),
    [],
  );

  // 3. [Parallel Fetching] 데이터 병렬 수급
  const {
    data: schedule,
    isLoading: isScheduleLoading,
    isFetching: isScheduleFetching,
  } = useMatchSchedule(year, month, activeTeamCode, leagueType);

  const { data: infiniteAttendances } = useInfiniteMyAttendances(
    PAGINATION_CONFIG.attendancesPageSize,
  );
  const { data: ticketAlarmsRes } = useTicketAlarms(
    PAGINATION_CONFIG.ticketAlarmsPage,
    PAGINATION_CONFIG.ticketAlarmsPageSize,
  );

  // 4. [Memoized Data Transformation] Map 변환 최적화
  const attendanceMap = useMemo(() => {
    const map = new Map<number, number>();
    infiniteAttendances?.pages.forEach((page) => {
      page?.data?.content?.forEach((a) => map.set(a.matchId, a.id));
    });
    return map;
  }, [infiniteAttendances]);

  const attendanceMatchIds = useMemo(() => {
    return new Set(attendanceMap.keys());
  }, [attendanceMap]);

  const ticketAlarmMap = useMemo(() => {
    const map = new Map<number, number>();
    ticketAlarmsRes?.content.forEach((a) => map.set(a.matchId, a.alarmId));
    return map;
  }, [ticketAlarmsRes]);

  // 5. 캘린더 그리드 생성
  const days = useCalendarGrid(
    year,
    month,
    schedule || [],
    today,
    undefined,
    attendanceMatchIds,
  );

  // 6. 상태 변경 핸들러 (URL 기반)
  const handleMoveMonth = useCallback(
    (offset: number) => {
      const { year: nextYear, month: nextMonth } = getRelativeMonth(
        year,
        month,
        offset,
      );
      router.setParams({
        year: nextYear.toString(),
        month: nextMonth.toString(),
      });
    },
    [year, month],
  );

  const handleSelectLeague = useCallback((type: LeagueType) => {
    router.setParams({ leagueType: type });
    setIsDropdownOpen(false);
  }, []);

  const goToday = useCallback(() => {
    router.setParams({
      year: today.year.toString(),
      month: today.month.toString(),
    });
  }, [today]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  return {
    currentDate: { year, month },
    today,
    activeTeam,
    activeTeamColorPath,
    league: {
      type: leagueType,
      isDropdownOpen,
    },
    calendar: {
      days,
      isFetching: isScheduleFetching,
    },
    maps: {
      attendanceMap,
      ticketAlarmMap,
    },
    handlers: {
      handleMoveMonth,
      handleSelectLeague,
      toggleDropdown,
      closeDropdown,
      goToday,
    },
    isLoading: isScheduleLoading,
    from,
  };
};
