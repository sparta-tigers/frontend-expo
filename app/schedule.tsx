import { Box, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TEAM_DATA, TeamCode, getTeamColorPath } from "@/src/utils/team";
import { useAuth } from "@/context/AuthContext";
import { useMatchSchedule } from "@/src/features/match/hooks/useMatchSchedule";
import { useCalendarGrid } from "@/src/shared/hooks/useCalendarGrid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScheduleSkeleton } from "@/src/features/home/components/ScheduleSkeleton";
import { getCurrentMonth, getCurrentYear, getRelativeMonth } from "@/src/utils/date";
import { LeagueType } from "@/src/features/match/types";

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
          <Typography variant="h2" weight="bold" color={getTeamColorPath(teamCode)}>
            {team.subName.toUpperCase()}
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
 * 아키텍처 원칙에 따라 URL 파라미터를 유일한 진실의 원천(SSOT)으로 삼음.
 */
export default function ScheduleScreen() {
  const { myTeam: myTeamId } = useAuth();
  const activeTeamCode = (myTeamId as TeamCode) || "KIA";

  // 1. [SSOT] URL 파라미터 기반 상태 관리
  const params = useLocalSearchParams<{ year?: string; month?: string; leagueType?: string }>();
  const year = params.year ? parseInt(params.year) : getCurrentYear();
  const month = params.month ? parseInt(params.month) : getCurrentMonth();
  const leagueType = (params.leagueType as LeagueType) || "REGULAR";

  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);

  // 2. 데이터 패칭 (URL 파라미터가 변경되면 자동으로 재실행됨)
  const { data: schedule, isLoading } = useMatchSchedule(year, month, activeTeamCode, leagueType);
  const days = useCalendarGrid(year, month, schedule || [], new Date().getDate());

  // 3. 핸들러 (상태를 직접 바꾸지 않고 URL 파라미터를 변경함)
  const handleMoveMonth = (offset: number) => {
    const { year: nextYear, month: nextMonth } = getRelativeMonth(year, month, offset);
    router.setParams({ year: nextYear.toString(), month: nextMonth.toString() });
  };

  const handleSelectLeague = (type: LeagueType) => {
    router.setParams({ leagueType: type });
    setIsLeagueModalOpen(false);
  };

  const leagueLabelMap: Record<LeagueType, string> = {
    PRESEASON: "시범경기",
    REGULAR: "정규리그",
    POST_SEASON: "포스트시즌",
  };

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

      {/* Filter & Calendar Content */}
      <Box px="SCREEN" py="md" align="center">
        {/* League Selector */}
        <Box flexDir="row" justify="center" align="center" width="100%" mb="md">
           <TouchableOpacity 
             onPress={() => setIsLeagueModalOpen(true)}
             activeOpacity={0.7}
             style={[styles.leagueSelector, { borderColor: theme.colors.team[activeTeamCode.toLowerCase() as keyof typeof theme.colors.team] || theme.colors.brand.mint }]}
           >
             <Typography 
               variant="caption" 
               color={getTeamColorPath(activeTeamCode)} 
               weight="bold"
             >
               {leagueLabelMap[leagueType]} ∨
             </Typography>
           </TouchableOpacity>
        </Box>

        {/* Month Selector */}
        <Box flexDir="row" align="center" mb="xl">
          <TouchableOpacity onPress={() => handleMoveMonth(-1)} style={styles.arrowBtn}>
            <MaterialIcons name="chevron-left" size={32} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          
          <Typography variant="h3" weight="bold" mx="lg">{year}년 {month}월</Typography>
          
          <TouchableOpacity onPress={() => handleMoveMonth(1)} style={styles.arrowBtn}>
            <MaterialIcons name="chevron-right" size={32} color={theme.colors.text.secondary} />
          </TouchableOpacity>
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
                bg={cell.isToday ? "brand.mintAlpha10" : "transparent"}
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

      {/* League Selection Modal */}
      <Modal visible={isLeagueModalOpen} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsLeagueModalOpen(false)}
        >
          <Box bg="card" rounded="lg" p="lg" width="80%">
            <Typography variant="h3" weight="bold" mb="md">리그 선택</Typography>
            {(Object.keys(leagueLabelMap) as LeagueType[]).map((type) => (
              <TouchableOpacity 
                key={type} 
                onPress={() => handleSelectLeague(type)}
                style={styles.modalItem}
              >
                <Typography 
                  variant="body1" 
                  color={leagueType === type ? "brand.mint" : "text.primary"}
                  weight={leagueType === type ? "bold" : "medium"}
                >
                  {leagueLabelMap[type]}
                </Typography>
              </TouchableOpacity>
            ))}
          </Box>
        </TouchableOpacity>
      </Modal>
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
  leagueSelector: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 999,
  },
  arrowBtn: {
    padding: 8,
  },
  matchBadgeText: {
    fontSize: 12,
  },
  matchTimeText: {
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.team.neutralLight,
  },
});
