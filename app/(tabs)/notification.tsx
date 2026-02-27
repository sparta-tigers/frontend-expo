import { SafeLayout } from "@/components/ui/safe-layout";
import { SPACING } from "@/constants/layout";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NotificationScreen() {
  const { colors } = useTheme();

  return (
    <SafeLayout
      style={{ backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.container, { borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>예매알림</Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          준비 중인 기능입니다.
        </Text>
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
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
  },
});
