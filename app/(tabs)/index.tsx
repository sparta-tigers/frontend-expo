import { SafeLayout } from "@/components/ui";
import { LineupSection } from "@/src/shared/components/match/LineupSection";
import { MyTeamSection } from "@/src/features/home/components/MyTeamSection";
import { RankingSummarySection } from "@/src/features/home/components/RankingSummarySection";
import { ScheduleSection } from "@/src/features/home/components/ScheduleSection";
import { commonStyles as styles } from "@/src/features/home/components/common.styles";
import React from "react";
import { ScrollView } from "react-native";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";
import { RankingSkeleton } from "@/src/features/home/components/RankingSkeleton";
import { useHomeDashboard } from "@/src/features/home/hooks/useHomeDashboard";

/**
 * 홈 화면 (`main_0`)
 *
 * Why: 비즈니스 로직은 useHomeDashboard로 완전히 위임하고,
 * 여기서는 선언적인 섹션 렌더링과 레이아웃 구성에만 집중한다.
 */
export default function HomeScreen() {
  const {
    user,
    stats,
    content,
    status,
    today,
    handlers,
  } = useHomeDashboard();

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MyTeamSection
          userNickname={user.nickname}
          enrollmentDays={stats.enrollmentDays}
          remainingMatches={stats.remainingMatches}
          attendanceCount={stats.attendanceCount}
          ticketAlarmCount={stats.ticketAlarmCount}
          teamMeta={user.myTeam}
          onPressChangeTeam={handlers.handlePressChangeTeam}
        />

        {status.isRankingLoading ? (
          <RankingSkeleton />
        ) : (
          <RankingSummarySection 
            ranking={content.ranking} 
            myTeamCode={user.myTeamId} 
          />
        )}

        <LineupSection lineup={content.lineup} teamMeta={user.myTeam} />

        {status.isScheduleLoading ? (
          <ScheduleSkeleton />
        ) : status.isScheduleError ? (
          <ScheduleSection schedule={[]} year={today.year} month={today.month} />
        ) : (
          <ScheduleSection 
            schedule={content.schedule} 
            year={today.year} 
            month={today.month}
            today={today}
            attendanceMatchIds={content.attendanceMatchIds}
          />
        )}
      </ScrollView>
    </SafeLayout>
  );
}
