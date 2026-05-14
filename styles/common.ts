import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet } from "react-native";

/**
 * 테마 색상 타입
 */
export interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  muted: string;
  accent: string;
  destructive: string;
  warning: string;
  info: string;
  success: string;
}

/**
 * 테마 색상 훅으로부터 색상 객체 생성
 */
export const useThemeColors = (): ThemeColors => ({
  primary: useThemeColor({}, "primary"),
  background: useThemeColor({}, "background"),
  card: useThemeColor({}, "card"),
  text: useThemeColor({}, "text"),
  border: useThemeColor({}, "border"),
  muted: useThemeColor({}, "muted"),
  accent: useThemeColor({}, "accent"),
  destructive: useThemeColor({}, "destructive"),
  warning: useThemeColor({}, "warning"),
  info: useThemeColor({}, "info"),
  success: useThemeColor({}, "success"),
});

/**
 * Button 컴포넌트 스타일 생성 함수
 */
export const createButtonStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },

    primary: {
      backgroundColor: colors.primary,
    },

    secondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    outline: {
      borderWidth: 1,
      borderColor: colors.primary,
    },

    ghost: {},

    sm: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 36,
    },

    md: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 44,
    },

    lg: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      minHeight: 52,
    },

    fullWidth: {
      width: "100%",
    },

    disabled: {
      opacity: 0.5,
    },

    text: {
      fontWeight: "600",
      textAlign: "center",
    },

    primaryText: {
      color: colors.background,
    },

    secondaryText: {
      color: colors.text,
    },

    outlineText: {
      color: colors.primary,
    },

    ghostText: {
      color: colors.primary,
    },
  });

/**
 * Input 컴포넌트 스타일 생성 함수
 */
export const createInputStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },

    label: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 6,
      color: colors.text,
    },

    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },

    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },

    inputError: {
      borderColor: colors.destructive,
    },

    inputDisabled: {
      backgroundColor: colors.muted,
      color: colors.text,
    },

    errorText: {
      fontSize: 12,
      color: colors.destructive,
      marginTop: 4,
    },
  });

/**
 * Card 컴포넌트 스타일 생성 함수
 */
export const createCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },

    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },

    elevated: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  });

/**
 * List 컴포넌트 스타일 생성 함수
 */
export const createListStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },

    headerButton: {
      minWidth: 100,
    },

    listContainer: {
      padding: 8,
    },

    itemContainer: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      shadowColor: colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },

    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },

    itemContent: {
      flex: 1,
    },

    itemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },

    itemDescription: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },

    itemPrice: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },

    itemDate: {
      fontSize: 12,
      color: colors.text,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
    },

    emptyText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    },

    emptyButton: {
      minWidth: 120,
    },

    loadingContainer: {
      paddingVertical: 20,
      alignItems: "center",
    },

    loadingText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 8,
    },
  });
