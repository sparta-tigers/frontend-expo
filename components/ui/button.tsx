import React from "react";
import { GestureResponderEvent, StyleSheet } from "react-native";
import { Button as PaperButton, useTheme } from "react-native-paper";

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
 * PWA의 Radix UI Button을 react-native-paper로 대체
 * - Paper Button 기반 터치 이벤트 처리
 * - 다양한 mode 지원 (contained, outlined, text)
 * - 로딩 상태 표시
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
  const theme = useTheme();

  // variant를 Paper의 mode로 변환
  const getMode = (): "contained" | "outlined" | "text" => {
    switch (variant) {
      case "primary":
        return "contained";
      case "outline":
        return "outlined";
      case "secondary":
      case "ghost":
        return "text";
      default:
        return "contained";
    }
  };

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

  // variant별 버튼 색상
  const getButtonColor = () => {
    switch (variant) {
      case "primary":
        return theme.colors.primary;
      case "secondary":
        return theme.colors.surfaceVariant;
      case "outline":
        return "transparent";
      case "ghost":
        return "transparent";
      default:
        return theme.colors.primary;
    }
  };

  // variant별 텍스트 색상
  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return theme.colors.onPrimary;
      case "secondary":
        return theme.colors.onSurfaceVariant;
      case "outline":
        return theme.colors.primary;
      case "ghost":
        return theme.colors.primary;
      default:
        return theme.colors.onPrimary;
    }
  };

  const buttonProps: any = {
    mode: getMode(),
    disabled: disabled || loading,
    loading: loading,
    style: [
      styles.button,
      getSizeStyle(),
      { backgroundColor: getButtonColor() },
      fullWidth && styles.fullWidth,
      style,
    ],
    contentStyle: [styles.content, fullWidth && styles.fullWidthContent],
    labelStyle: [
      styles.label,
      { color: getTextColor() },
      getSizeStyle(),
      textStyle,
    ],
  };

  if (onPress) {
    buttonProps.onPress = (e: GestureResponderEvent) => onPress(e);
  }

  return <PaperButton {...buttonProps}>{children}</PaperButton>;
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
  label: {
    fontWeight: "600",
    textAlign: "center",
  },
  fullWidth: {
    width: "100%",
  },
  fullWidthContent: {
    width: "100%",
  },
});
