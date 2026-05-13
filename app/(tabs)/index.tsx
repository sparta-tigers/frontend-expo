import { SafeLayout } from "@/components/ui";
import { LineupSection } from "@/src/features/home/components/LineupSection";
import { MyTeamSection } from "@/src/features/home/components/MyTeamSection";
import { RankingSummarySection } from "@/src/features/home/components/RankingSummarySection";
import { ScheduleSection } from "@/src/features/home/components/ScheduleSection";
import { useFakeHomeData } from "@/src/features/home/mocks";
import { commonStyles as styles } from "@/src/features/home/components/common.styles";
import React, { useMemo } from "react";
import { ScrollView } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { findTeamMeta, TeamCode } from "@/src/utils/team";
import { router } from "expo-router";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { useMatchRanking } from "@/src/features/match/hooks/useMatchRanking";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";
import { RankingSkeleton } from "@/src/features/home/components/RankingSkeleton";
import { getTodayString, getCurrentYear, getCurrentMonth, getCurrentDay } from "@/src/utils/date";
import { useDashboardSummary } from "@/src/features/home/hooks/useDashboardSummary";
import { useInfiniteMyAttendances } from "@/src/features/match-attendance/queries";

/**
 * 홈 화면 (`main_0`)
 *
 * Why: 실제 API 연동 전에 UI 골격을 먼저 고정하고, 이후 데이터 연동을 단계적으로 진행한다.
 * 경기 일정은 실제 API 데이터를 사용하며, 나머지는 단계적으로 전환한다.
 */
export default function HomeScreen() {
  const { myTeam: myTeamId } = useAuth();
  const mockData = useFakeHomeData(myTeamId);

  // 🚨 앙드레 카파시: 결정론적 기준 시점 설정
  const todayString = useMemo(() => getTodayString(), []);
  const currentYear = useMemo(() => getCurrentYear(), []);
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const today = useMemo(() => ({
    year: getCurrentYear(),
    month: getCurrentMonth(),
    day: getCurrentDay()
  }), []);

  // 경기 일정 실제 데이터 패칭
  const { data: schedule, isLoading: isScheduleLoading, isError: isScheduleError } = useMatchSchedule(
    currentYear, 
    currentMonth, 
    myTeamId as TeamCode | null
  );

  // 🚨 [Phase 7] 순위 데이터 실제 연동 (Mapped UI Model)
  const rankingQuery = useMatchRanking({
    viewMode: "day",
    date: todayString,
    leagueType: "REGULAR",
  });
  const ranking = useMemo(() => rankingQuery.data ?? [], [rankingQuery.data]);
  const isRankingLoading = rankingQuery.isLoading;

  // 🚨 [Phase 10] 대시보드 요약 데이터 연동
  const { data: dashboardRes } = useDashboardSummary();
  const dashboardData = dashboardRes?.data;

  // 🚨 [Phase 28] 직관 기록 데이터 연동 (무한 스크롤 첫 페이지 활용)
  const { data: infiniteAttendances } = useInfiniteMyAttendances(100);
  const attendanceMatchIds = useMemo(() => {
    const firstPageContent = infiniteAttendances?.pages[0]?.data?.content ?? [];
    return new Set(firstPageContent.map((a) => a.matchId));
  }, [infiniteAttendances]);

  const totalAttendanceCount = infiniteAttendances?.pages[0]?.data?.totalElements ?? 0;

  const displayRankings = useMemo(() => {
    // 🚨 앙드레 카파시: 데이터 타입 방어 (Array.isArray 미준수 시 TypeError 발생 위험)
    if (!Array.isArray(ranking) || ranking.length === 0) return [];
    
    const top5 = ranking.slice(0, 5);
    const myTeamRank = ranking.find(r => r.teamCode === myTeamId);
    
    // 내 팀이 상위 5위 안에 없으면 추가
    if (myTeamRank && !top5.find(r => r.teamCode === myTeamId)) {
      return [...top5, myTeamRank];
    }
    
    return top5;
  }, [ranking, myTeamId]);

  const myTeam = useMemo(() => findTeamMeta(myTeamId), [myTeamId]);

  const handlePressChangeTeam = () => {
    router.push("/change-team");
  };

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MyTeamSection
          userNickname={dashboardData?.nickname ?? mockData.userNickname}
          enrollmentDays={dashboardData?.enrollmentDays ?? 0}
          remainingMatches={dashboardData?.remainingMatches ?? 0}
          attendanceCount={totalAttendanceCount}
          teamMeta={myTeam}
          onPressChangeTeam={handlePressChangeTeam}
        />

        {isRankingLoading ? (
          <RankingSkeleton />
        ) : (
          <RankingSummarySection 
            ranking={displayRankings} 
            myTeamCode={myTeamId as TeamCode | null} 
          />
        )}

        <LineupSection lineup={dashboardData?.todayLineup ?? []} teamMeta={myTeam} />

        {isScheduleLoading ? (
          <ScheduleSkeleton />
        ) : isScheduleError ? (
          <ScheduleSection schedule={[]} year={currentYear} month={currentMonth} />
        ) : (
          <ScheduleSection 
            schedule={schedule ?? []} 
            year={currentYear} 
            month={currentMonth}
            today={today}
            attendanceMatchIds={attendanceMatchIds}
          />
        )}
      </ScrollView>
    </SafeLayout>
  );
}
