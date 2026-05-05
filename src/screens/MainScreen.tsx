import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { theme } from "@/src/styles/theme";

/**
 * 메인 스크린 컴포넌트
 * 앱의 첫 화면을 담당
 */
const MainScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        스파르타 타이거즈
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Expo 앱에 오신 것을 환영합니다!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.SCREEN,
  },
  title: {
    fontSize: theme.typography.size.TITLE,
    fontWeight: "bold",
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.size.BODY,
    textAlign: "center",
  },
});

export default MainScreen;
