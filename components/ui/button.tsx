import { theme } from "@/src/styles/theme";
import React from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Button 컴포넌트 속성
 */
interface ButtonProps {
  /** 버튼 텍스트 */
  children: React.ReactNode;
  /** 버튼 클릭 핸들러 */
  onPress?: (e?: GestureResponderEvent) => void;
  /** 버튼 비활성화 상태 */
  disabled?: boolean;
  /** 로딩 상태 표시 */
  loading?: boolean;
  /** 버튼 스타일 변형 */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /** 버튼 크기 */
  size?: "sm" | "md" | "lg";
  /** 전체 너비 차지 */
  fullWidth?: boolean;
  /** 커스텀 스타일 */
  style?: any;
  /** 텍스트 스타일 */
  textStyle?: any;
}

/**
 * 기본 Button 컴포넌트
 *
 * PWA의 Radix UI Button을 React Native로 대체
 * - TouchableOpacity 기반 터치 이벤트 처리
 * - 다양한 variant 지원 (contained, outlined, text)
 * - 커스텀 테마 시스템 적용
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  style,
  textStyle,
}) => {
  // 🚨 앙드레 카파시: Props 인터페이스는 외부 호환성을 위해 유지함.

  // 🚨 앙드레 카파시: Props 인터페이스는 외부 호환성을 위해 유지함.
  // 내부 구현만 테마 토큰 기반으로 리팩토링.
  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return { height: 36, paddingHorizontal: theme.spacing.md };
      case "md":
        return { height: 44, paddingHorizontal: theme.spacing.lg };
      case "lg":
        return { height: 52, paddingHorizontal: theme.spacing.xxl };
      default:
        return { height: 44, paddingHorizontal: theme.spacing.lg };
    }
  };

  // variant별 버튼 스타일
  const getButtonStyle = () => {
    const baseStyle = {
      ...styles.button,
      ...getSizeStyle(),
      ...(fullWidth && styles.fullWidth),
      ...style,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.brand.mint, // 1:1 매핑: 기존 colors.primary가 가리키던 메인 컬러
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.medium,
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: theme.colors.brand.mint,
        };
      case "ghost":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.brand.mint,
        };
    }
  };

  // variant별 텍스트 스타일
  const getTextStyle = () => {
    const baseTextStyle = {
      ...styles.text,
      ...textStyle,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseTextStyle,
          color: theme.colors.background,
        };
      case "secondary":
        return {
          ...baseTextStyle,
          color: theme.colors.text.primary,
        };
      case "outline":
        return {
          ...baseTextStyle,
          color: theme.colors.brand.mint,
        };
      case "ghost":
        return {
          ...baseTextStyle,
          color: theme.colors.brand.mint,
        };
      default:
        return {
          ...baseTextStyle,
          color: theme.colors.background,
        };
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading && (
          <Text style={[styles.loadingText, getTextStyle()]}>...</Text>
        )}
        <Text style={getTextStyle()}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.BUTTON,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: theme.typography.weight.semibold,
    textAlign: "center",
    fontSize: theme.typography.size.md,
  },
  loadingText: {
    marginRight: theme.spacing.xs,
  },
  fullWidth: {
    width: "100%",
  },
});
