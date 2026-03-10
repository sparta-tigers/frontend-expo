import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Error Boundary Fallback 컴포넌트
 *
 * 앱에서 발생한 치명적인 에러를 사용자에게 보여주고
 * 앱 재시작 기능을 제공하는 UI
 */
interface ErrorBoundaryFallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  const { colors } = useTheme();

  // error를 Error 타입으로 안전하게 변환
  const errorObj = error instanceof Error ? error : new Error(String(error));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.destructive }]}>
          치명적인 오류가 발생했습니다
        </Text>

        <Text style={[styles.message, { color: colors.text }]}>
          앱 실행 중 예기치 않은 문제가 발생했습니다. 아래 버튼을 눌러 앱을 다시
          시작해주세요.
        </Text>

        {__DEV__ && (
          <View style={[styles.debugInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.errorTitle, { color: colors.muted }]}>
              개발자 정보:
            </Text>
            <Text style={[styles.errorText, { color: colors.muted }]}>
              {errorObj.name}: {errorObj.message}
            </Text>
          </View>
        )}

        <Button
          onPress={resetErrorBoundary}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.retryButtonText, { color: colors.background }]}>
            앱 다시 시작
          </Text>
        </Button>
      </View>
    </View>
  );
}

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.SECTION,
  },
  content: {
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: SPACING.COMPONENT,
  },
  message: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.COMPONENT,
  },
  debugInfo: {
    width: "100%",
    padding: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.CARD,
    marginBottom: SPACING.COMPONENT,
  },
  errorTitle: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.TINY,
  },
  errorText: {
    fontSize: FONT_SIZE.CAPTION,
    fontFamily: "monospace",
  },
  retryButton: {
    paddingHorizontal: SPACING.SECTION * 2,
    paddingVertical: SPACING.COMPONENT,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
  },
});
