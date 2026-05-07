import { theme } from "@/src/styles/theme";
import React from "react";
import { View, ViewProps, ViewStyle } from "react-native";

export type ThemeColorPath = 
  | keyof typeof theme.colors 
  | `text.${keyof typeof theme.colors.text}`
  | `brand.${keyof typeof theme.colors.brand}`
  | `team.${keyof typeof theme.colors.team}`
  | `border.${keyof typeof theme.colors.border}`
  | `dashboard.${keyof typeof theme.colors.dashboard}`
  | "transparent";

/**
 * 테마 컬러를 재귀적으로 찾아주는 유틸리티
 */
const resolveThemeColor = (path: string): string | undefined => {
  const parts = path.split(".");
  let current: any = theme.colors;
  
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return typeof current === "string" ? current : undefined;
};

/**
 * Box 컴포넌트의 커스텀 Props
 */
interface BoxCustomProps {
  /** 테마 스패이싱 토큰 (padding) */
  p?: keyof typeof theme.spacing;
  /** 가로 패딩 */
  px?: keyof typeof theme.spacing;
  /** 세로 패딩 */
  py?: keyof typeof theme.spacing;
  /** 상단 패딩 */
  pt?: keyof typeof theme.spacing;
  /** 하단 패딩 */
  pb?: keyof typeof theme.spacing;
  /** 좌측 패딩 */
  pl?: keyof typeof theme.spacing;
  /** 우측 패딩 */
  pr?: keyof typeof theme.spacing;
  /** 테마 스패이싱 토큰 (margin) */
  m?: keyof typeof theme.spacing;
  /** 가로 마진 */
  mx?: keyof typeof theme.spacing;
  /** 세로 마진 */
  my?: keyof typeof theme.spacing;
  /** 상단 마진 */
  mt?: keyof typeof theme.spacing;
  /** 하단 마진 */
  mb?: keyof typeof theme.spacing;
  /** 좌측 마진 */
  ml?: keyof typeof theme.spacing;
  /** 우측 마진 */
  mr?: keyof typeof theme.spacing;
  /** 배경색 (테마 컬러 키) */
  bg?: ThemeColorPath;
  /** 테마 반경 토큰 */
  rounded?: keyof typeof theme.radius;
  /** 상단 테마 반경 토큰 */
  roundedTop?: keyof typeof theme.radius;
  /** 하단 테마 반경 토큰 */
  roundedBottom?: keyof typeof theme.radius;
  /** 플렉스 */
  flex?: ViewStyle["flex"];
  /** 가로 크기 */
  width?: ViewStyle["width"];
  /** 세로 크기 */
  height?: ViewStyle["height"];
  /** 최소 높이 */
  minHeight?: ViewStyle["minHeight"];
  /** 플렉스 방향 */
  flexDir?: ViewStyle["flexDirection"];
  /** 플렉스 랩 */
  flexWrap?: ViewStyle["flexWrap"];
  /** 정렬 */
  align?: ViewStyle["alignItems"];
  /** self 정렬 */
  alignSelf?: ViewStyle["alignSelf"];
  /** justify */
  justify?: ViewStyle["justifyContent"];
  /** 간격 */
  gap?: keyof typeof theme.spacing;
  /** 포지션 */
  position?: ViewStyle["position"];
  /** 포지션 값 */
  top?: ViewStyle["top"];
  bottom?: ViewStyle["bottom"];
  left?: ViewStyle["left"];
  right?: ViewStyle["right"];
  /** 테두리 */
  borderWidth?: ViewStyle["borderWidth"];
  borderColor?: ThemeColorPath;
  borderTopWidth?: ViewStyle["borderTopWidth"];
  borderBottomWidth?: ViewStyle["borderBottomWidth"];
  borderLeftWidth?: ViewStyle["borderLeftWidth"];
  borderRightWidth?: ViewStyle["borderRightWidth"];
  /** 오버플로우 */
  overflow?: ViewStyle["overflow"];
}

export interface BoxProps extends ViewProps, BoxCustomProps {}

/**
 * 디자인 시스템의 최소 단위 컨테이너 컴포넌트
 * 
 * Why: 일관된 간격(Spacing)과 반경(Radius)을 유지하기 위해 직접 숫자를 쓰지 않고
 * 테마 토큰을 Props로 강제함. ViewProps를 상속받아 확장성을 보장함.
 */
export const Box = ({
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  m,
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  bg,
  rounded,
  roundedTop,
  roundedBottom,
  flex,
  width,
  height,
  minHeight,
  flexDir,
  flexWrap,
  align,
  alignSelf,
  justify,
  gap,
  position,
  top,
  bottom,
  left,
  right,
  borderWidth,
  borderColor,
  borderTopWidth,
  borderBottomWidth,
  borderLeftWidth,
  borderRightWidth,
  overflow,
  style,
  children,
  ...rest
}: BoxProps) => {
  const getSpacing = (val: keyof typeof theme.spacing | undefined) => {
    return val ? theme.spacing[val] : undefined;
  };

  const getRadius = (val: keyof typeof theme.radius | undefined) => {
    return val ? theme.radius[val] : undefined;
  };

  // 🚨 앙드레 카파시: exactOptionalPropertyTypes 대응을 위해 정의된 값만 스타일에 포함
  const boxStyle: ViewStyle = {};
  
  if (p !== undefined) boxStyle.padding = getSpacing(p);
  if (px !== undefined) boxStyle.paddingHorizontal = getSpacing(px);
  if (py !== undefined) boxStyle.paddingVertical = getSpacing(py);
  if (pt !== undefined) boxStyle.paddingTop = getSpacing(pt);
  if (pb !== undefined) boxStyle.paddingBottom = getSpacing(pb);
  if (pl !== undefined) boxStyle.paddingLeft = getSpacing(pl);
  if (pr !== undefined) boxStyle.paddingRight = getSpacing(pr);
  
  if (m !== undefined) boxStyle.margin = getSpacing(m);
  if (mx !== undefined) boxStyle.marginHorizontal = getSpacing(mx);
  if (my !== undefined) boxStyle.marginVertical = getSpacing(my);
  if (mt !== undefined) boxStyle.marginTop = getSpacing(mt);
  if (mb !== undefined) boxStyle.marginBottom = getSpacing(mb);
  if (ml !== undefined) boxStyle.marginLeft = getSpacing(ml);
  if (mr !== undefined) boxStyle.marginRight = getSpacing(mr);

  if (bg !== undefined) {
    boxStyle.backgroundColor = resolveThemeColor(bg) || (theme.colors as any)[bg];
  }
  
  if (flex !== undefined) boxStyle.flex = flex;
  if (flexDir !== undefined) boxStyle.flexDirection = flexDir;
  if (flexWrap !== undefined) boxStyle.flexWrap = flexWrap;
  if (align !== undefined) boxStyle.alignItems = align;
  if (alignSelf !== undefined) boxStyle.alignSelf = alignSelf;
  if (justify !== undefined) boxStyle.justifyContent = justify;
  if (width !== undefined) boxStyle.width = width;
  if (height !== undefined) boxStyle.height = height;
  if (minHeight !== undefined) boxStyle.minHeight = minHeight;
  if (gap !== undefined) boxStyle.gap = getSpacing(gap);
  
  if (rounded !== undefined) boxStyle.borderRadius = getRadius(rounded);
  if (roundedTop !== undefined) {
    boxStyle.borderTopLeftRadius = getRadius(roundedTop);
    boxStyle.borderTopRightRadius = getRadius(roundedTop);
  }
  if (roundedBottom !== undefined) {
    boxStyle.borderBottomLeftRadius = getRadius(roundedBottom);
    boxStyle.borderBottomRightRadius = getRadius(roundedBottom);
  }
  
  if (position !== undefined) boxStyle.position = position;
  if (top !== undefined) boxStyle.top = top;
  if (bottom !== undefined) boxStyle.bottom = bottom;
  if (left !== undefined) boxStyle.left = left;
  if (right !== undefined) boxStyle.right = right;
  
  if (borderWidth !== undefined) boxStyle.borderWidth = borderWidth;
  if (borderTopWidth !== undefined) boxStyle.borderTopWidth = borderTopWidth;
  if (borderBottomWidth !== undefined) boxStyle.borderBottomWidth = borderBottomWidth;
  if (borderLeftWidth !== undefined) boxStyle.borderLeftWidth = borderLeftWidth;
  if (borderRightWidth !== undefined) boxStyle.borderRightWidth = borderRightWidth;
  if (borderColor !== undefined) {
    boxStyle.borderColor = resolveThemeColor(borderColor) || (theme.colors as any)[borderColor];
  }
  if (overflow !== undefined) boxStyle.overflow = overflow;

  return (
    <View style={[boxStyle, style]} {...rest}>
      {children}
    </View>
  );
};
