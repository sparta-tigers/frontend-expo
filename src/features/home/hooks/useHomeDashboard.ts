import { useMemo, useCallback } from "react";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { findTeamMeta, TeamCode } from "@/src/utils/team";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { useMatchRanking } from "@/src/features/match/hooks/useMatchRanking";
import { useDashboardSummary } from "@/src/features/home/hooks/useDashboardSummary";
import { useInfiniteMyAttendances, useAttendanceCount } from "@/src/features/match-attendance/queries";
import { useTicketAlarmCount } from "@/src/features/ticket-alarm/hooks/useTicketAlarm";
import { getTodayString, getCurrentYear, getCurrentMonth, getCurrentDay } from "@/src/utils/date";

/**
 * 🏠 useHomeDashboard
 * 
 * Why: 홈 화면의 비대해진 로직을 통합 관리하고, 
 * 데이터 패칭의 병목(Waterfall)을 방지하며 선언적으로 의존성을 제어함.
 */
export function useHomeDashboard() {
  const { myTeam: myTeamId } = useAuth();

  // 🚨 기준 시점 설정 (결정론적 렌더링)
  const todayInfo = useMemo(() => {
    const year = getCurrentYear();
    const month = getCurrentMonth();
    const day = getCurrentDay();
    const todayString = getTodayString();
    return { year, month, day, todayString };
  }, []);

  // ========================================================
  // ⚡ 병렬 데이터 패칭 (Parallel Data Fetching)
  // Why: 각 쿼리는 독립적으로 실행되며, 선언적 enabled 옵션으로 의존성 제어.
  // ========================================================

  // 1. 경기 일정 (팀 코드가 있을 때만 실행되지만, 전체 흐름은 병렬)
  const scheduleQuery = useMatchSchedule(
    todayInfo.year, 
    todayInfo.month, 
    myTeamId as TeamCode | null
  );

  // 2. 순위 데이터 (오늘 날짜 기준)
  const rankingQuery = useMatchRanking({
    viewMode: "day",
    date: todayInfo.todayString,
    leagueType: "REGULAR",
  });

  // 3. 대시보드 요약 (닉네임, 잔여 경기 등)
  const summaryQuery = useDashboardSummary();

  // 4. 직관 기록 (캘린더 하이라이트용)
  const attendanceInfiniteQuery = useInfiniteMyAttendances(100);

  // 5. 올해 직관 횟수
  const attendanceCountQuery = useAttendanceCount(todayInfo.year);

  // 6. 예매 알람 개수
  const ticketAlarmQuery = useTicketAlarmCount();

  // ========================================================
  // 🛠️ 데이터 정제 (Derived States)
  // Why: UI 레이어에서 복잡한 가공 로직을 제거함.
  // ========================================================

  const myTeam = useMemo(() => findTeamMeta(myTeamId), [myTeamId]);

  const displayRankings = useMemo(() => {
    const ranking = rankingQuery.data ?? [];
    if (!Array.isArray(ranking) || ranking.length === 0) return [];
    
    const top5 = ranking.slice(0, 5);
    const myTeamRank = ranking.find(r => r.teamCode === myTeamId);
    
    if (myTeamRank && !top5.find(r => r.teamCode === myTeamId)) {
      return [...top5, myTeamRank];
    }
    return top5;
  }, [rankingQuery.data, myTeamId]);

  const attendanceMatchIds = useMemo(() => {
    const firstPageContent = attendanceInfiniteQuery.data?.pages[0]?.data?.content ?? [];
    return new Set(firstPageContent.map((a) => a.matchId));
  }, [attendanceInfiniteQuery.data]);

  // ========================================================
  // 🎯 핸들러 (Action Handlers)
  // ========================================================

  const handlePressChangeTeam = useCallback(() => {
    router.push("/change-team");
  }, []);

  return {
    user: {
      nickname: summaryQuery.data?.data?.nickname ?? "팬",
      myTeam,
      myTeamId: myTeamId as TeamCode | null,
    },
    stats: {
      enrollmentDays: summaryQuery.data?.data?.enrollmentDays ?? 0,
      remainingMatches: summaryQuery.data?.data?.remainingMatches ?? 0,
      attendanceCount: attendanceCountQuery.data ?? 0,
      ticketAlarmCount: ticketAlarmQuery.data ?? 0,
    },
    content: {
      ranking: displayRankings,
      lineup: summaryQuery.data?.data?.todayLineup ?? [],
      schedule: scheduleQuery.data ?? [],
      attendanceMatchIds,
    },
    status: {
      isRankingLoading: rankingQuery.isLoading,
      isScheduleLoading: scheduleQuery.isLoading,
      isScheduleError: scheduleQuery.isError,
    },
    today: todayInfo,
    handlers: {
      handlePressChangeTeam,
    },
  };
}
