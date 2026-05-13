import { StyleSheet } from "react-native";
import { theme } from "@/src/styles/theme";

/**
 * 홈 화면 전체 레이아웃 및 공통 스타일
 */
export const commonStyles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  // 공통 섹션 간격
  section: {
    paddingHorizontal: theme.layout.dashboard.screenPaddingHorizontal,
    marginTop: theme.layout.dashboard.sectionGap,
  },
  sectionHeaderLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.brand.subtitle,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
});
