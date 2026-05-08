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
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";

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
  // Why: UI 렌더링의 기준이 되는 '오늘'을 컴포넌트 최상단에서 정의하여 하위 컴포넌트들이 동일한 시간을 바라보게 함.
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0=Jan, 1=Feb, ...)
  const todayDay = now.getDate();

  // 경기 일정 실제 데이터 패칭 (월은 API 사양에 따라 1-indexed로 변환)
  // 🚨 [Strict Typing] myTeamId를 TeamCode로 캐스팅하여 타입 안정성 확보
  const { data: schedule, isLoading, isError } = useMatchSchedule(
    currentYear, 
    currentMonth + 1, 
    myTeamId as TeamCode | null
  );

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
          userNickname={mockData.userNickname}
          daysInSchool={mockData.daysInSchool}
          myTeamId={myTeamId}
          onPressChangeTeam={handlePressChangeTeam}
        />

        <RankingSummarySection ranking={mockData.rankingSummary} />

        <LineupSection lineup={mockData.todayLineup} teamName={myTeam.name} />

        {isLoading ? (
          <ScheduleSkeleton />
        ) : isError ? (
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
