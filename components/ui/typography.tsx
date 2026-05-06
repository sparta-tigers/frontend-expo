/* eslint-disable react-native/no-unused-styles */
import { theme } from "@/src/styles/theme";
import React from "react";
import { Text, TextProps, TextStyle, StyleSheet } from "react-native";

export type TypographyVariant = 
  | "h1" 
  | "h2" 
  | "h3" 
  | "body1" 
  | "body2" 
  | "caption" 
  | "label";

/**
 * Typography 컴포넌트의 커스텀 Props
 */
interface TypographyCustomProps {
  /** 텍스트 스타일 변체 */
  variant?: TypographyVariant;
  /** 텍스트 두께 */
  weight?: keyof typeof theme.typography.weight;
  /** 텍스트 색상 (테마 컬러 키 또는 raw string) */
  color?: keyof typeof theme.colors.text | keyof typeof theme.colors | string;
  /** 가운데 정렬 여부 */
  center?: boolean;
}

export interface TypographyProps extends TextProps, TypographyCustomProps {}

/**
 * 디자인 시스템의 표준 텍스트 컴포넌트
 * 
 * Why: 폰트 크기, 두께, 색상의 파편화를 방지하고 선언적인 UI를 작성하기 위해 사용함.
 * TextProps를 상속받아 numberOfLines, onLayout 등을 그대로 사용할 수 있음.
 */
export const Typography = ({
  variant = "body1",
  weight,
  color,
  center,
  style,
  children,
  ...rest
}: TypographyProps) => {
  const variantStyle = styles[variant];
  
  const customStyle: TextStyle = {
    fontWeight: weight ? theme.typography.weight[weight] : variantStyle.fontWeight,
    color: color 
      ? ((theme.colors.text as any)[color] || (theme.colors as any)[color] || color)
      : (theme.colors.text.primary),
    textAlign: center ? "center" : undefined,
  };

  return (
    <Text style={[variantStyle, customStyle, style]} {...rest}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: theme.typography.size.TITLE,
    fontWeight: theme.typography.weight.bold,
  },
  h2: {
    fontSize: theme.typography.size.SECTION_TITLE,
    fontWeight: theme.typography.weight.bold,
  },
  h3: {
    fontSize: theme.typography.size.CARD_TITLE,
    fontWeight: theme.typography.weight.semibold,
  },
  body1: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.regular,
  },
  body2: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
  },
  label: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  },
  caption: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.regular,
  },
});
