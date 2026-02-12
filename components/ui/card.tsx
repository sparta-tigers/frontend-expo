import React from "react";
import { GestureResponderEvent } from "react-native";
import { Card as PaperCard } from "react-native-paper";

/**
 * Card 컴포넌트 속성
 */
interface CardProps {
  /** 카드 내용 */
  children: React.ReactNode;
  /** 카드 클릭 핸들러 */
  onPress?: (e: GestureResponderEvent) => void;
  /** 카드 변형 */
  variant?: "default" | "outlined" | "elevated";
  /** 전체 너비 차지 */
  fullWidth?: boolean;
  /** 커스텀 스타일 */
  style?: any;
}

/**
 * Card 컴포넌트
 *
 * React Native Paper의 Card를 래핑
 * - Material Design 스타일 적용
 * - 그림자 효과 지원
 * - 터치 이벤트 지원
 */
export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = "default",
  fullWidth = false,
  style,
}) => {
  const getCardMode = () => {
    switch (variant) {
      case "outlined":
        return "outlined";
      case "elevated":
        return "elevated";
      default:
        return "elevated";
    }
  };

  const cardProps: any = {
    mode: getCardMode(),
    style: fullWidth ? { width: "100%" } : style,
  };

  if (onPress) {
    cardProps.onPress = onPress;
  }

  return <PaperCard {...cardProps}>{children}</PaperCard>;
};
