import { theme } from "@/src/styles/theme";
import React from "react";
import { View, ViewProps, ViewStyle } from "react-native";

/**
 * Box 컴포넌트의 커스텀 Props
 */
interface BoxCustomProps {
  /** 테마 스패이싱 토큰 (padding) */
  p?: keyof typeof theme.spacing | undefined;
  /** 가로 패딩 */
  px?: keyof typeof theme.spacing | undefined;
  /** 세로 패딩 */
  py?: keyof typeof theme.spacing | undefined;
  /** 상단 패딩 */
  pt?: keyof typeof theme.spacing | undefined;
  /** 하단 패딩 */
  pb?: keyof typeof theme.spacing | undefined;
  /** 좌측 패딩 */
  pl?: keyof typeof theme.spacing | undefined;
  /** 우측 패딩 */
  pr?: keyof typeof theme.spacing | undefined;
  /** 테마 스패이싱 토큰 (margin) */
  m?: keyof typeof theme.spacing | undefined;
  /** 가로 마진 */
  mx?: keyof typeof theme.spacing | undefined;
  /** 세로 마진 */
  my?: keyof typeof theme.spacing | undefined;
  /** 상단 마진 */
  mt?: keyof typeof theme.spacing | undefined;
  /** 하단 마진 */
  mb?: keyof typeof theme.spacing | undefined;
  /** 좌측 마진 */
  ml?: keyof typeof theme.spacing | undefined;
  /** 우측 마진 */
  mr?: keyof typeof theme.spacing | undefined;
  /** 배경색 (테마 컬러 키 또는 raw string) */
  bg?: keyof typeof theme.colors | string;
  /** 테마 반경 토큰 */
  rounded?: keyof typeof theme.radius;
  /** 플렉스 방향 */
  flexDir?: ViewStyle["flexDirection"];
  /** 정렬 */
  align?: ViewStyle["alignItems"];
  /** 정렬 */
  justify?: ViewStyle["justifyContent"];
  /** 간격 */
  gap?: keyof typeof theme.spacing;
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
  flexDir,
  align,
  justify,
  gap,
  style,
  children,
  ...rest
}: BoxProps) => {
  const boxStyle: ViewStyle = {
    padding: p ? theme.spacing[p] : undefined,
    paddingHorizontal: px ? theme.spacing[px] : undefined,
    paddingVertical: py ? theme.spacing[py] : undefined,
    paddingTop: pt ? theme.spacing[pt] : undefined,
    paddingBottom: pb ? theme.spacing[pb] : undefined,
    paddingLeft: pl ? theme.spacing[pl] : undefined,
    paddingRight: pr ? theme.spacing[pr] : undefined,
    margin: m ? theme.spacing[m] : undefined,
    marginHorizontal: mx ? theme.spacing[mx] : undefined,
    marginVertical: my ? theme.spacing[my] : undefined,
    marginTop: mt ? theme.spacing[mt] : undefined,
    marginBottom: mb ? theme.spacing[mb] : undefined,
    marginLeft: ml ? theme.spacing[ml] : undefined,
    marginRight: mr ? theme.spacing[mr] : undefined,
    backgroundColor: bg 
      ? (bg in theme.colors ? (theme.colors as any)[bg] : bg) 
      : undefined,
    borderRadius: rounded ? theme.radius[rounded] : undefined,
    flexDirection: flexDir,
    alignItems: align,
    justifyContent: justify,
    gap: gap ? theme.spacing[gap] : undefined,
  };

  return (
    <View style={[boxStyle, style]} {...rest}>
      {children}
    </View>
  );
};
