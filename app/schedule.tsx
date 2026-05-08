import { Box, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import { Stack, router } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TEAM_DATA, TeamCode, getTeamColorPath } from "@/src/utils/team";
import { useAuth } from "@/context/AuthContext";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";

// ========================================================
// 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerHeight: 60,
  calendarCellHeight: 80,
} as const;

// ========================================================
// [SHARED] 브랜딩 헤더 컴포넌트
// ========================================================
const BrandingHeader: React.FC<{ teamCode: TeamCode }> = ({ teamCode }) => {
  const insets = useSafeAreaInsets();
  const team = TEAM_DATA[teamCode] || TEAM_DATA["KIA"];

  return (
    <Box 
      style={{ paddingTop: insets.top }} 
      bg="background" 
      px="SCREEN"
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderColor="team.neutralLight"
    >
      <Box 
        height={LOCAL_LAYOUT.headerHeight} 
        flexDir="row" 
        align="center" 
        justify="space-between"
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back-ios" size={24} color={theme.colors.brand.subtitle} />
        </TouchableOpacity>
        
        <Box flexDir="row" align="center">
          <Typography variant="h2" weight="bold" color="text.primary" mr="xs">
            {team.shortName.toUpperCase()}
          </Typography>
          <Typography variant="h2" weight="bold" color="team.kia">
            TIGERS
          </Typography>
        </Box>

        <Box width={24} />
      </Box>
      
      <Box align="center" pb="md">
         <Typography variant="h1" style={styles.mascotEmoji}>
           {team.mascotEmoji}
         </Typography>
      </Box>
    </Box>
  );
};

/**
 * 경기 일정 화면 (`main_1`)
 * 
 * Why: 월간 경기 일정을 캘린더 형태로 제공.
 * 리그 순위(Ranking)와는 별개의 도메인 파일로 관리하여 아키텍처의 선명함을 유지함.
 */
export default function ScheduleScreen() {
  const { myTeam: myTeamId } = useAuth();
  const activeTeamCode = (myTeamId as TeamCode) || "KIA";

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  // 실제 API 데이터 패칭
  const { data: schedule, isLoading } = useMatchSchedule(year, month, activeTeamCode);
  const days = useCalendarGrid(year, month - 1, schedule || [], now.getDate());

  if (isLoading) return (
    <Box flex={1} bg="background">
      <Stack.Screen options={{ headerShown: false }} />
      <BrandingHeader teamCode={activeTeamCode} />
      <ScheduleSkeleton />
    </Box>
  );

  return (
    <Box flex={1} bg="background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Branded Header */}
      <BrandingHeader teamCode={activeTeamCode} />

      {/* Filter & Calendar Content (이미지 2 기획 반영) */}
      <Box px="SCREEN" py="md" align="center">
        {/* League Dropdown & View Toggle Navigation */}
        <Box flexDir="row" justify="center" align="center" width="100%" mb="md" gap="md">
           <Box px="md" py={6} borderWidth={1} borderColor="team.kia" rounded="full">
             <Typography variant="caption" color="team.kia" weight="bold">정규리그 ∨</Typography>
           </Box>
           
           {/* 순위 화면으로 이동하는 버튼 (선택 사항) */}
           <TouchableOpacity 
             onPress={() => router.replace("/ranking")}
             style={styles.rankingNavBtn}
           >
             <Typography variant="caption" color="brand.subtitle">연도별 순위 〉</Typography>
           </TouchableOpacity>
        </Box>

        {/* Month Selector */}
        <Box flexDir="row" align="center" mb="xl">
          <MaterialIcons name="chevron-left" size={24} color={theme.colors.text.secondary} />
          <Typography variant="h3" weight="bold" mx="lg">{year}년 {month}월</Typography>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
        </Box>

        {/* Calendar Grid Header */}
        <Box flexDir="row" bg="team.neutralLight" roundedTop="lg" overflow="hidden" width="100%">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <Box key={d} flex={1} py="sm" align="center">
              <Typography variant="caption" weight="bold" color={i === 0 || i === 6 ? "brand.mint" : "brand.subtitle"}>
                {d}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Grid Body */}
        <Box flexDir="row" flexWrap="wrap" borderWidth={StyleSheet.hairlineWidth} borderColor="team.neutralLight" width="100%">
          {days.map((cell, idx) => {
            const isEmpty = cell.day === 0;
            return (
              <Box 
                key={`${cell.day}-${idx}`} 
                style={styles.calendarCell}
                bg={cell.isToday ? "brand.mintTransparent" : "transparent"}
              >
                {!isEmpty && (
                  <>
                    <Box flexDir="row" justify="space-between" width="100%">
                      <Typography variant="caption" color={cell.isToday ? "brand.mint" : "text.secondary"}>
                        {cell.day}
                      </Typography>
                      {cell.location && (
                        <Typography variant="caption" weight="bold" color="brand.mint">
                          {cell.location}
                        </Typography>
                      )}
                    </Box>
                    {cell.hasGame && (
                      <Box flex={1} justify="center" align="center">
                        <Box 
                          bg={cell.opponentCode ? getTeamColorPath(cell.opponentCode) : "team.neutralLight"} 
                          rounded="full" p="xs" mb="xxs"
                        >
                          <Typography style={styles.matchBadgeText}>🏟️</Typography>
                        </Box>
                        <Typography variant="caption" style={styles.matchTimeText} weight="bold">
                          {cell.timeText}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  calendarCell: {
    width: "14.285%", 
    height: LOCAL_LAYOUT.calendarCellHeight,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.team.neutralLight,
    padding: 4,
  },
  mascotEmoji: {
    fontSize: 40,
  },
  rankingNavBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.team.neutralLight,
    borderRadius: 999,
  },
  matchBadgeText: {
    fontSize: 12,
  },
  matchTimeText: {
    fontSize: 9,
  },
});
