import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";

/**
 * Card 컴포넌트 속성
 */
interface CardProps {
  /** 카드 내용 */
  children: React.ReactNode;
  /** 카드 클릭 핸들러 */
  onPress?: () => void;
  /** 카드 변형 */
  variant?: "default" | "outlined" | "elevated";
  /** 카드 패딩 */
  padding?: number;
  /** 전체 너비 차지 */
  fullWidth?: boolean;
  /** 커스텀 스타일 */
  style?: ViewStyle;
}

/**
 * 기본 Card 컴포넌트
 *
 * PWA의 Radix UI Card를 React Native로 대체
 * - 다양한 변형 지원
 * - 그림자 효과
 * - 터치 이벤트 지원
 */
export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = "default",
  padding = 16,
  fullWidth = false,
  style,
}) => {
  const backgroundColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor,
      borderRadius: 12,
      padding,
      width: fullWidth ? "100%" : undefined,
    };

    const variantStyles = {
      default: {},
      outlined: {
        borderWidth: 1,
        borderColor,
      },
      elevated: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...style,
    };
  };

  // onPress가 있을 경우 TouchableOpacity로 감싸기
  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
};
