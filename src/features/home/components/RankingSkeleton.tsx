import { Box } from '@/components/ui';
import { theme } from '@/src/styles/theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { usePulseOpacity } from '@/src/features/home/hooks/usePulseOpacity';

/**
 * 순위 요약 섹션 스켈레톤 UI
 *
 * Why: 데이터 로딩 시 ActivityIndicator 대신 실제 UI와 동일한 레이아웃을 미리 보여주어
 * 레이아웃 시프트(Layout Shift)를 방지하고 시각적 연속성을 제공함.
 */
export const RankingSkeleton = () => {
  const opacity = usePulseOpacity(0.3, 0.7, 1000);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Box mt="xxxxl" px="xxxl">
      {/* Title Skeleton */}
      <Box align="center" mb="md">
        <Animated.View style={[styles.titleSkeleton, animatedStyle]} />
      </Box>

      {/* Row Skeletons */}
      <Box gap="sm">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Box key={i} flexDir="row" align="center" gap="sm">
            <Box width={theme.spacing.xxl} align="center">
              <Animated.View style={[styles.rankSkeleton, animatedStyle]} />
            </Box>
            <Animated.View
              style={[
                styles.pillSkeleton,
                animatedStyle,
                i === 4 && styles.myTeamHighlight, // 4번째를 가상의 내 팀으로 표시하여 레이아웃 유지
              ]}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  titleSkeleton: {
    width: '70%',
    height: theme.layout.dashboard.sectionTitleHeight,
    backgroundColor: theme.colors.team.neutralLight,
    borderRadius: theme.radius.sm,
  },
  rankSkeleton: {
    width: theme.spacing.xl,
    height: theme.spacing.xl,
    backgroundColor: theme.colors.team.neutralLight,
    borderRadius: theme.radius.sm,
  },
  pillSkeleton: {
    flex: 1,
    height: theme.layout.dashboard.rankingRowHeight,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    ...theme.shadow.card,
  },
  myTeamHighlight: {
    height: theme.layout.dashboard.rankingRowHeightActive,
    borderColor: theme.colors.team.neutralLight,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
