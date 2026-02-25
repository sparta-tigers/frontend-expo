import { DARK_THEME, LIGHT_THEME, ThemeColors } from "@/constants/theme";
import { useTheme as useThemeContext } from "@/context/ThemeContext";
import { useColorScheme } from "react-native";

/**
 * 개선된 테마 훅
 *
 * 시스템 테마 + 사용자 선택 테마 지원
 * 라이트/다크 모드 자동 감지 및 수동 전환 기능
 */
export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { theme, toggleTheme } = useThemeContext();

  // 사용자가 선택한 테마가 있으면 그것을 사용, 없으면 시스템 테마 사용
  const currentTheme = theme || systemColorScheme;
  const colors = currentTheme === "dark" ? DARK_THEME : LIGHT_THEME;

  // 디버깅: theme가 undefined일 경우 로그 출력
  if (!theme) {
    console.log("🔍 useTheme: theme is undefined, using system theme");
  }

  return {
    theme: currentTheme,
    colors,
    isSystemTheme: theme === null,
    toggleTheme,
    colorScheme: systemColorScheme,
  };
};

/**
 * 테마 색상 가져오기 헬퍼
 *
 * @param colorName 색상 이름
 * @returns 현재 테마에 맞는 색상 값
 */
export const useThemeColor = (colorName: keyof ThemeColors) => {
  const { colors } = useTheme();
  return colors[colorName];
};
