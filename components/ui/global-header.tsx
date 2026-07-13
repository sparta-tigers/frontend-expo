import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { Box } from './box';
import { Typography } from './typography';
import { IconSymbol } from './icon-symbol';
import { theme } from '@/src/styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GlobalHeader() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const inAuthGroup = segments[0] === '(auth)';

  // null 대신 높이와 opacity로 제어하여 Reanimated 뷰 계층 안정성 확보
  const headerHeight = inAuthGroup ? 0 : undefined;
  const opacity = inAuthGroup ? 0 : 1;

  const topLevelPaths = ['/', '/liveboard', '/exchange', '/history', '/notification'];
  const isTopLevel = topLevelPaths.includes(pathname);
  const showBackButton = !isTopLevel;

  return (
    <Box
      flexDir="row"
      align="center"
      justify="space-between"
      px="xl"
      py="lg"
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top + theme.spacing.md,
          height: headerHeight,
          opacity,
        },
      ]}
    >
      <Box width={48} align="flex-start">
        {showBackButton ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerIconBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
          >
            <IconSymbol
              size={theme.layout.header.backIconSize}
              name="chevron.left"
              color={theme.colors.team.neutralDark}
            />
          </TouchableOpacity>
        ) : null}
      </Box>

      <Typography variant="h3" weight="black" color="brand.mint" style={styles.headerTitle}>
        YAGUNIV
      </Typography>

      <Box width={48} align="flex-end">
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerIconBtn}
          onPress={() => router.push('/profile')}
        >
          <IconSymbol
            name="person.fill"
            size={theme.layout.header.profileIconSize}
            color={theme.colors.team.neutralDark}
          />
        </TouchableOpacity>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    overflow: 'hidden',
  },
  headerTitle: {
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    padding: theme.spacing.xs,
  },
});
