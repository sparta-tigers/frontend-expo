import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/src/store/useToastStore';
import { Box } from './box';
import { Typography } from './typography';
import { IconSymbol, IconSymbolName } from './icon-symbol';
import { theme } from '@/src/styles/theme';

export function Toast() {
  const { isVisible, title, message, type, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();

  const [isRendered, setIsRendered] = useState(false);
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isVisible) {
      setIsRendered(true);
      translateY.value = withSpring(0, { damping: 12, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 200 });

      timer = setTimeout(() => {
        hideToast();
      }, 3000);
    } else {
      translateY.value = withTiming(-20, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setIsRendered)(false);
        }
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, hideToast, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!isVisible && !isRendered) return null;

  let iconName: IconSymbolName = 'info.circle.fill';
  let iconColor: string = theme.colors.info;
  const bg = 'rgba(255, 255, 255, 0.95)';

  if (type === 'success') {
    iconName = 'checkmark.circle.fill';
    iconColor = theme.colors.success;
  } else if (type === 'error') {
    iconName = 'exclamationmark.triangle.fill';
    iconColor = theme.colors.error;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: bg,
        },
        animatedStyle,
      ]}
    >
      <Box flexDir="row" align="center" style={styles.content}>
        <IconSymbol name={iconName} size={24} color={iconColor} />
        <Box flex={1} ml="md">
          <Typography variant="body1" weight="bold" color="text.primary">
            {title}
          </Typography>
          {message ? (
            <Typography variant="caption" color="text.secondary" style={styles.message}>
              {message}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: theme.radius.xl,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    marginTop: 2,
  },
});
