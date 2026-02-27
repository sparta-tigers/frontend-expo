import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LiveboardScreen() {
  const { colors } = useTheme();

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      {/* 프로필 버튼 */}
      <View style={styles.profileButtonContainer}>
        <Button variant="outline" onPress={() => router.push("/profile")}>
          프로필
        </Button>
      </View>

      <View style={[styles.container, { borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>라이브보드</Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          실시간 경기 정보와 라이브 스코어를 제공합니다.
        </Text>
        <Text style={[styles.comingSoon, { color: colors.primary }]}>
          준비 중인 기능입니다.
        </Text>
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  profileButtonContainer: {
    position: "absolute",
    top: SPACING.SCREEN,
    right: SPACING.SCREEN,
    zIndex: 1,
  },
  container: {
    flex: 1,
    padding: SPACING.SCREEN,
    borderWidth: 1,
    borderRadius: 8,
    margin: SPACING.SCREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: SPACING.SMALL,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: SPACING.COMPONENT,
  },
  comingSoon: {
    fontSize: 18,
    fontWeight: "600",
  },
});
