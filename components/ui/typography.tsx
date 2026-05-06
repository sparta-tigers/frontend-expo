import { theme } from "@/src/styles/theme";
import React from "react";
import { Text, TextProps, TextStyle } from "react-native";

export type TypographyVariant = 
  | "h1" 
  | "h2" 
  | "h3" 
  | "body1" 
  | "body2" 
  | "caption" 
  | "label";

/**
 * 테마 컬러를 재귀적으로 찾아주는 유틸리티
 */
const resolveThemeColor = (path: string, obj: Record<string, unknown>): string | undefined => {
  const result = path.split(".").reduce((acc: unknown, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
  return typeof result === "string" ? result : undefined;
};

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
  /** 상단 마진 */
  mt?: keyof typeof theme.spacing | number;
  /** 하단 마진 */
  mb?: keyof typeof theme.spacing | number;
  /** 좌측 마진 */
  ml?: keyof typeof theme.spacing | number;
  /** 우측 마진 */
  mr?: keyof typeof theme.spacing | number;
  /** 수평 마진 */
  mx?: keyof typeof theme.spacing | number;
  /** 수직 마진 */
  my?: keyof typeof theme.spacing | number;
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
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  style,
  children,
  ...rest
}: TypographyProps) => {
  const variantStyle = VARIANT_STYLES[variant];

  const getSpacing = (val: keyof typeof theme.spacing | number | undefined) => {
    if (typeof val === "number") return val;
    return val ? theme.spacing[val] : undefined;
  };
  
  const resolvedColor = color 
    ? (color.includes('.') 
        ? resolveThemeColor(color, theme.colors) 
        : ((theme.colors as Record<string, any>)[color] || color))
    : theme.colors.text.primary;

  const customStyle: TextStyle = {
    fontWeight: weight ? theme.typography.weight[weight] : variantStyle.fontWeight,
    color: resolvedColor as string,
    textAlign: center ? "center" : undefined,
    marginTop: getSpacing(mt),
    marginBottom: getSpacing(mb),
    marginLeft: getSpacing(ml),
    marginRight: getSpacing(mr),
    marginHorizontal: getSpacing(mx),
    marginVertical: getSpacing(my),
  };

  return (
    <Text style={[variantStyle, customStyle, style]} {...rest}>
      {children}
    </Text>
  );
};

const VARIANT_STYLES = {
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
} as const;
