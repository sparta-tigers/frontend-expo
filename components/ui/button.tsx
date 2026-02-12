import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

/**
 * Button 컴포넌트 속성
 */
interface ButtonProps {
  /** 버튼 텍스트 */
  children: React.ReactNode;
  /** 버튼 클릭 핸들러 */
  onPress?: () => void;
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
  style?: ViewStyle;
  /** 텍스트 스타일 */
  textStyle?: TextStyle;
}

/**
 * 기본 Button 컴포넌트
 *
 * PWA의 Radix UI Button을 React Native로 대체
 * - TouchableOpacity 기반 터치 이벤트 처리
 * - 다양한 변형과 크기 지원
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
  const backgroundColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    };

    // 크기 스타일
    const sizeStyles = {
      sm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
      md: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 44 },
      lg: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 52 },
    };

    // 변형 스타일
    const variantStyles = {
      primary: {
        backgroundColor,
      },
      secondary: {
        backgroundColor: "#E5E7EB",
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor,
      },
      ghost: {
        backgroundColor: "transparent",
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? "100%" : undefined,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: "600",
      textAlign: "center",
    };

    // 크기별 텍스트 스타일
    const sizeStyles = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    // 변형별 텍스트 색상
    const variantColors = {
      primary: { color: "#FFFFFF" },
      secondary: { color: "#1F2937" },
      outline: { color: textColor },
      ghost: { color: textColor },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantColors[variant],
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#FFFFFF" : textColor}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={getTextStyle()}>{children}</Text>
    </TouchableOpacity>
  );
};
