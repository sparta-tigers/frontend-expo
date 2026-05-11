// app/profile/profile.styles.ts
import { StyleSheet } from "react-native";
import { theme } from "@/src/styles/theme";

export const LOCAL_LAYOUT = {
  profileAvatarSize: 80,
  userAvatarSize: 60,
  bottomSheetSnapPoint: "60%",
  scrollBottomPadding: 40,
} as const;

export const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: LOCAL_LAYOUT.scrollBottomPadding,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  logoutButton: {
    borderColor: theme.colors.error,
    borderWidth: 1,
    marginTop: theme.spacing.sm,
  },
  sheetIndicator: {
    backgroundColor: theme.colors.border.medium,
  },
  sheetContent: {
    paddingBottom: theme.spacing.xxl,
  },
  teamItem: {
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.medium,
  },
  deleteButton: {
    paddingVertical: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.xs,
  },
});
