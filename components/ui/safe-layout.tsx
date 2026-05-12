import { SPACING } from "@/src/styles/theme";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

/**
 * SafeLayout \ucef4\ud3ec\ub10c\ud2b8 Props
 */
interface SafeLayoutProps {
  children: React.ReactNode;
  /** \ucd94\uac00 \uc2a4\ud0c0\uc77c (\uc120\ud0dd\uc0ac\ud56d) */
  style?: StyleProp<ViewStyle>;
  /** SafeAreaView edges \uc124\uc815 (\uc120\ud0dd\uc0ac\ud56d) */
  edges?: Edge[];
  /** 내부 콘텐츠에 기본 패딩 적용 여부 */
  withPadding?: boolean;
  /** 반응형 디자인 사용 여부 */
  responsive?: boolean;
  /** 플랫폼별 다른 처리 (iOS/Android) */
  platform?: "ios" | "android" | "both";
}

/**
 * SafeLayout 컴포넌트
 *
 * SafeAreaView를 기반으로 한 표준 레이아웃 컴포넌트
 * - 노치 및 시스템 UI 영역 자동 처리 (모든 기종 지원)
 * - 반응형 마진/패딩 적용 (태블릿 대응)
 * - 플랫폼별 최적화 (iOS/Android)
 * - 통일된 스타일 확장 지원
 *
 * @example
 * ```tsx
 * <SafeLayout withPadding responsive>
 *   <Text>모든 기종에서 최적화된 콘텐츠</Text>
 * </SafeLayout>
 *
 * <SafeLayout
 *   responsive
 *   edges={["top", "left", "right"]}
 *   platform="ios"
 * >
 *   <Text>iOS 전용 최적화</Text>
 * </SafeLayout>
 * ```
 */
export function SafeLayout({
  children,
  style,
  edges = ["left", "right", "bottom"],
  withPadding = false,
  responsive = false,
  platform = "both",
}: SafeLayoutProps) {
  // 플랫폼 필터링
  const shouldRender =
    platform === "both" ||
    (platform === "ios" && Platform.OS === "ios") ||
    (platform === "android" && Platform.OS === "android");

  if (!shouldRender) {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  // 반응형 스타일 계산 (성능 최적화됨)
  const responsiveStyles = responsive
    ? {
        content: {
          paddingHorizontal: SPACING.SCREEN,
        },
      }
    : {};

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      <View
        style={[
          styles.fill, // 🔥 핵심: 항상 화면을 꽉 채우도록 보장
          withPadding && styles.content,
          withPadding && responsiveStyles.content,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.SCREEN,
  },
});

export default SafeLayout;
