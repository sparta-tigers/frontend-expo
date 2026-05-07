import React from "react";
import { ViewProps } from "react-native";
import { Box } from "./box";
import { Typography } from "./typography";

interface SectionProps extends ViewProps {
  /** 섹션 제목 */
  title?: string;
  /** 제목 옆 보조 텍스트 또는 컴포넌트 */
  rightElement?: React.ReactNode;
  /** 제목 하단 여백 사용 여부 (기본값: true) */
  hasTitleMargin?: boolean;
}

/**
 * 표준 섹션 레이아웃 컴포넌트
 * 
 * Why: 화면 내의 논리적 구분을 일관된 스타일(제목 폰트, 여백 등)로 처리하기 위해 정의함.
 */
export const Section = ({
  title,
  rightElement,
  hasTitleMargin = true,
  children,
  style,
  ...rest
}: SectionProps) => {
  return (
    <Box m="SCREEN" style={style} {...rest}>
      {title && (
        <Box 
          flexDir="row" 
          align="center" 
          justify="space-between" 
          mb={hasTitleMargin ? "md" : undefined as any}
        >
          <Typography variant="h2">{title}</Typography>
          {rightElement}
        </Box>
      )}
      {children}
    </Box>
  );
};
