import { SafeLayout } from "@/components/ui/safe-layout";
import { LineupSection } from "@/src/features/home/components/LineupSection";
import { MyTeamSection } from "@/src/features/home/components/MyTeamSection";
import { RankingSummarySection } from "@/src/features/home/components/RankingSummarySection";
import { ScheduleSection } from "@/src/features/home/components/ScheduleSection";
import { useFakeHomeData } from "@/src/features/home/mocks";
import { styles } from "@/src/features/home/styles";
import React from "react";
import { ScrollView } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { TEAM_DATA } from "@/src/utils/team";
import { router } from "expo-router";

/**
 * 홈 화면 (`main_0`)
 *
 * Why: 실제 API 연동 전에 UI 골격을 먼저 고정하고, 이후 데이터 연동을 단계적으로 진행한다.
 * 모든 데이터는 "가짜 데이터"로만 렌더링한다.
 */
export default function HomeScreen() {
  const { myTeam: myTeamId } = useAuth();
  const mockData = useFakeHomeData();

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

        <ScheduleSection schedule={mockData.monthSchedule} />
      </ScrollView>
    </SafeLayout>
  );
}
