import { useTheme } from "@/hooks/useTheme";
import { FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * 오프라인 배너 컴포넌트
 *
 * 네트워크 연결이 끊겼을 때 화면 상단에 표시되는 경고 배너
 */
export function OfflineBanner() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.destructive,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.background }]}>
        인터넷 연결이 끊겼습니다. 네트워크 상태를 확인해주세요.
      </Text>
    </View>
  );
}

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.COMPONENT,
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    textAlign: "center",
  },
});
