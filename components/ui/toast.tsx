import React, { useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/src/store/useToastStore';
import { Box } from './box';
import { Typography } from './typography';
import { IconSymbol, IconSymbolName } from './icon-symbol';
import { theme } from '@/src/styles/theme';

export function Toast() {
  const { isVisible, title, message, type, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();

  const translateY = React.useRef(new Animated.Value(-20)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          hideToast();
        });
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-20);
      opacity.setValue(0);
    }
    return undefined;
  }, [isVisible, hideToast, opacity, translateY, title, message, type]);

  if (!isVisible) return null;

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
          opacity: opacity,
          transform: [{ translateY: translateY }],
        },
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
