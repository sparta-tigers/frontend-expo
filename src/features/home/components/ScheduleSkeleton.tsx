import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Box } from "@/components/ui";
import { theme } from "@/src/styles/theme";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ScheduleSection.tsx와 동일하게 유지하여 레이아웃 어긋남 방지
// ========================================================
const LOCAL_LAYOUT = {
  wrapWidth: theme.layout.dashboard.calendarWidth,
  headerHeight: theme.layout.dashboard.calendarHeaderHeight,
  cellWidth: theme.layout.dashboard.calendarCellWidth,
  cellHeight: theme.layout.dashboard.calendarCellHeight,
  calendarRadius: theme.layout.dashboard.calendarRadius,
} as const;

/**
 * 경기 일정 섹션용 스켈레톤 UI
 * 
 * Why: 팀 변경 시 queryKey 교체로 인한 로딩 상태에서 레이아웃 깜빡임을 방지하고
 * 사용자에게 데이터 로딩 중임을 시각적으로 부드럽게 전달함.
 */
export const ScheduleSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 부드러운 펄스 애니메이션 적용
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Box mt="xxxxl" pb="xxl" px="SCREEN_DASHBOARD">
      {/* Title Skeleton */}
      <Box 
        height={theme.layout.dashboard.sectionTitleHeight} 
        align="center" 
        justify="center" 
        mb="md"
      >
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
      </Box>

      <Box width={LOCAL_LAYOUT.wrapWidth} alignSelf="center">
        {/* Calendar Header Skeleton */}
        <Box 
          height={LOCAL_LAYOUT.headerHeight} 
          bg="team.neutralLight" 
          roundedTop="calendar" 
          flexDir="row" 
          overflow="hidden"
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <Box key={i} flex={1} align="center" justify="center">
              <Animated.View style={[styles.headerDaySkeleton, { opacity }]} />
            </Box>
          ))}
        </Box>

        {/* Calendar Grid Skeleton (5주 가정) */}
        <Box 
          bg="card" 
          roundedBottom="calendar" 
          flexDir="row" 
          flexWrap="wrap" 
          overflow="hidden" 
          borderWidth={StyleSheet.hairlineWidth} 
          borderColor="team.neutralLight"
        >
          {Array.from({ length: 35 }).map((_, i) => (
            <View key={i} style={styles.cell}>
              <Box flexDir="row" justify="space-between" width="100%">
                <Animated.View style={[styles.dayNumSkeleton, { opacity }]} />
              </Box>
              
              {/* 경기 있을 자리에 배포되는 배지 스켈레톤 */}
              <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
              
              {/* 시간 정보 스켈레톤 */}
              <Animated.View style={[styles.timeSkeleton, { opacity }]} />
            </View>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  titleSkeleton: {
    width: 180,
    height: 20,
    backgroundColor: theme.colors.team.neutralLight,
    borderRadius: theme.radius.sm,
  },
  headerDaySkeleton: {
    width: 16,
    height: 12,
    backgroundColor: theme.colors.card, // 헤더 배경 대비 가독성 있는 배경색
    opacity: 0.5,
    borderRadius: 2,
  },
  cell: {
    width: LOCAL_LAYOUT.cellWidth,
    height: LOCAL_LAYOUT.cellHeight,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.team.neutralLight,
    padding: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayNumSkeleton: {
    width: 14,
    height: 10,
    backgroundColor: theme.colors.team.neutralLight,
    borderRadius: 2,
  },
  badgeSkeleton: {
    width: 36,
    height: 18,
    backgroundColor: theme.colors.team.neutralLight,
    borderRadius: theme.radius.round,
  },
  timeSkeleton: {
    width: 28,
    height: 8,
    backgroundColor: theme.colors.team.neutralLight,
    borderRadius: 2,
  },
});
