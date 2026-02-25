import { useTheme } from "@/hooks/useTheme";
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
  const { colors } = useTheme();

  // 크기별 스타일
  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return { height: 36, paddingHorizontal: 12 };
      case "md":
        return { height: 44, paddingHorizontal: 16 };
      case "lg":
        return { height: 52, paddingHorizontal: 24 };
      default:
        return { height: 44, paddingHorizontal: 16 };
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
          backgroundColor: colors.primary,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case "ghost":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
    }
  };

  // variant별 텍스트 스타일
  const getTextStyle = () => {
    const baseTextStyle = {
      ...styles.text,
      ...getSizeStyle(),
      ...textStyle,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseTextStyle,
          color: colors.background,
        };
      case "secondary":
        return {
          ...baseTextStyle,
          color: colors.text,
        };
      case "outline":
        return {
          ...baseTextStyle,
          color: colors.primary,
        };
      case "ghost":
        return {
          ...baseTextStyle,
          color: colors.primary,
        };
      default:
        return {
          ...baseTextStyle,
          color: colors.background,
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
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  loadingText: {
    marginRight: 4,
  },
  fullWidth: {
    width: "100%",
  },
});
