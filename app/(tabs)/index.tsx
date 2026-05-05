import { SafeLayout } from "@/components/ui/safe-layout";
import { LineupSection } from "@/src/features/home/components/LineupSection";
import { MyTeamSection } from "@/src/features/home/components/MyTeamSection";
import { RankingSummarySection } from "@/src/features/home/components/RankingSummarySection";
import { ScheduleSection } from "@/src/features/home/components/ScheduleSection";
import { useFakeHomeData } from "@/src/features/home/mocks";
import { styles } from "@/src/features/home/styles";
import React from "react";
import { ScrollView } from "react-native";

/**
 * 홈 화면 (`main_0`)
 *
 * Why: 실제 API 연동 전에 UI 골격을 먼저 고정하고, 이후 데이터 연동을 단계적으로 진행한다.
 * 모든 데이터는 "가짜 데이터"로만 렌더링한다.
 */
export default function HomeScreen() {
  const data = useFakeHomeData();

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MyTeamSection
          userNickname={data.userNickname}
          daysInSchool={data.daysInSchool}
          myTeam={data.myTeam}
          stats={data.myTeamStats}
          onPressChangeTeam={() => {}}
        />

        <RankingSummarySection ranking={data.rankingSummary} />

        <LineupSection lineup={data.todayLineup} teamName={data.myTeam.name} />

        <ScheduleSection schedule={data.monthSchedule} />
      </ScrollView>
    </SafeLayout>
  );
}
