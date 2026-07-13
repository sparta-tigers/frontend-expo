import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Box } from './box';
import { Typography } from './typography';
import { IconSymbol } from './icon-symbol';
import { theme } from '@/src/styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GlobalHeader({ withTopInset = false }: { withTopInset?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Box
      flexDir="row"
      align="center"
      justify="space-between"
      px="xl"
      py="lg"
      style={{
        paddingTop: (withTopInset ? insets.top : 0) + theme.spacing.md,
      }}
    >
      <Box width={48} align="flex-start">
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerIconBtn}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
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
      </Box>

      <Typography variant="h3" weight="black" color="brand.mint" style={styles.headerTitle}>
        YAGUNIV
      </Typography>

      <Box width={48} align="flex-end">
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerIconBtn}
          accessibilityRole="button"
          accessibilityLabel="프로필"
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
  headerTitle: {
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    padding: theme.spacing.xs,
  },
});
