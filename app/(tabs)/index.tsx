import { SafeLayout } from "@/components/ui/safe-layout";
import { LineupSection } from "@/src/features/home/components/LineupSection";
import { MyTeamSection } from "@/src/features/home/components/MyTeamSection";
import { RankingSummarySection } from "@/src/features/home/components/RankingSummarySection";
import { ScheduleSection } from "@/src/features/home/components/ScheduleSection";
import { useFakeHomeData } from "@/src/features/home/mocks";
import { styles } from "@/src/features/home/styles";
import React, { useMemo } from "react";
import { ScrollView } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { TEAM_DATA, TeamCode } from "@/src/utils/team";
import { router } from "expo-router";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { useMatchRanking } from "@/src/features/match/hooks/useMatchRanking";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";
import { RankingSkeleton } from "@/src/features/home/components/RankingSkeleton";
import { getTodayString, getCurrentYear, getCurrentMonth, getCurrentDay } from "@/src/utils/date";
import { useDashboardSummary } from "@/src/features/home/hooks/useDashboardSummary";

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
  const todayDay = useMemo(() => getCurrentDay(), []);

  // 경기 일정 실제 데이터 패칭
  const { data: schedule, isLoading: isScheduleLoading, isError: isScheduleError } = useMatchSchedule(
    currentYear, 
    currentMonth, 
    myTeamId as TeamCode | null
  );

  // 🚨 [Phase 7] 순위 데이터 실제 연동
  const { data: rankingRes, isLoading: isRankingLoading } = useMatchRanking({
    viewMode: "day",
    date: todayString,
    leagueType: "REGULAR",
  });

  // 🚨 [Phase 10] 대시보드 요약 데이터 연동
  const { data: dashboardRes } = useDashboardSummary();
  const dashboardData = dashboardRes?.data;

  // 🚨 앙드레 카파시: 데이터 슬라이싱 최적화 (Top 5 + My Team)
  const displayRankings = useMemo(() => {
    if (!rankingRes?.data) return [];
    
    const allRankings = rankingRes.data;
    const top5 = allRankings.slice(0, 5);
    const myTeamRank = allRankings.find(r => r.teamCode === myTeamId);
    
    // 내 팀이 상위 5위 안에 없으면 추가
    if (myTeamRank && !top5.find(r => r.teamCode === myTeamId)) {
      return [...top5, myTeamRank];
    }
    
    return top5;
  }, [rankingRes?.data, myTeamId]);

  // 🚨 앙드레 카파시: 낙관적 업데이트를 고려한 데이터 병합
  // Why: AsyncStorage에서 로드된 실제 응원팀 정보가 있다면 우선 사용, 없으면 목 데이터 사용.
  const myTeam = (myTeamId && TEAM_DATA[myTeamId]) || mockData.myTeam;

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
          userNickname={dashboardData?.nickname || mockData.userNickname}
          enrollmentDays={dashboardData?.enrollmentDays || 0}
          remainingMatches={dashboardData?.remainingMatches || 0}
          favoriteTeamCode={myTeamId || dashboardData?.favoriteTeamCode}
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

        <LineupSection lineup={mockData.todayLineup} teamName={myTeam.name} />

        {isScheduleLoading ? (
          <ScheduleSkeleton />
        ) : isScheduleError ? (
          <ScheduleSection schedule={[]} year={currentYear} month={currentMonth} />
        ) : (
          <ScheduleSection 
            schedule={schedule || []} 
            year={currentYear} 
            month={currentMonth}
            todayDay={todayDay}
          />
        )}
      </ScrollView>
    </SafeLayout>
  );
}
