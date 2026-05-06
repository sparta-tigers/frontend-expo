import { Box, Typography } from "@/components/ui";
import React from "react";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  containerPadding: 20,
  titleSize: 24,
  titleBottomMargin: 10,
  subtitleSize: 16,
} as const;

/**
 * 메인 스크린 컴포넌트
 * 
 * Why: 앱의 시작 화면 또는 안내 화면으로 활용.
 * Zero-Magic UI 원칙에 따라 Box와 Typography 프리미티브를 사용하여 구조화함.
 */
const MainScreen: React.FC = () => {
  return (
    <Box 
      flex={1} 
      justify="center" 
      align="center" 
      bg="background" 
      px={LOCAL_LAYOUT.containerPadding}
    >
      <Typography 
        variant="h1" 
        weight="bold" 
        mb={LOCAL_LAYOUT.titleBottomMargin}
      >
        스파르타 타이거즈
      </Typography>
      <Typography variant="body1" center color="secondary">
        Expo 앱에 오신 것을 환영합니다!
      </Typography>
    </Box>
  );
};

export default MainScreen;
