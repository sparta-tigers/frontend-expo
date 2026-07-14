import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, SPACING } from '@/src/styles/theme';
import { StyleSheet, Text } from 'react-native';
import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

/**
 * 오프라인 배너 컴포넌트
 *
 * 네트워크 연결이 끊겼을 때 화면 상단에 표시되는 경고 배너
 */
export function OfflineBanner({ isConnected }: { isConnected: boolean }) {
  const { colors } = useTheme();

  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isConnected) {
      height.value = withTiming(40, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      height.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isConnected, height, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.destructive,
          borderBottomColor: colors.border,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.text, { color: colors.background }]}>
        인터넷 연결이 끊겼어요. 네트워크 상태를 확인해주세요.
      </Text>
    </Animated.View>
  );
}

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.COMPONENT,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: '600',
    textAlign: 'center',
  },
});
