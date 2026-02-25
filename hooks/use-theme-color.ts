/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { DARK_THEME, LIGHT_THEME } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof LIGHT_THEME & keyof typeof DARK_THEME,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const themeColors = theme === "light" ? LIGHT_THEME : DARK_THEME;
    return themeColors[colorName];
  }
}
