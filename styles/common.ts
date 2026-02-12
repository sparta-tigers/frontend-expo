import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, TextStyle, ViewStyle } from "react-native";

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
    } as ViewStyle,

    primary: {
      backgroundColor: colors.primary,
    } as ViewStyle,

    secondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    } as ViewStyle,

    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    } as ViewStyle,

    ghost: {
      backgroundColor: "transparent",
    } as ViewStyle,

    sm: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 36,
    } as ViewStyle,

    md: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 44,
    } as ViewStyle,

    lg: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      minHeight: 52,
    } as ViewStyle,

    fullWidth: {
      width: "100%",
    } as ViewStyle,

    disabled: {
      opacity: 0.5,
    } as ViewStyle,

    text: {
      fontWeight: "600",
      textAlign: "center",
    } as TextStyle,

    primaryText: {
      color: "#FFFFFF",
    } as TextStyle,

    secondaryText: {
      color: colors.text,
    } as TextStyle,

    outlineText: {
      color: colors.primary,
    } as TextStyle,

    ghostText: {
      color: colors.primary,
    } as TextStyle,
  });

/**
 * Input 컴포넌트 스타일 생성 함수
 */
export const createInputStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    } as ViewStyle,

    label: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 6,
      color: colors.text,
    } as TextStyle,

    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    } as TextStyle,

    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    } as TextStyle,

    inputError: {
      borderColor: colors.destructive,
    } as TextStyle,

    inputDisabled: {
      backgroundColor: colors.muted,
      color: colors.text,
    } as TextStyle,

    errorText: {
      fontSize: 12,
      color: colors.destructive,
      marginTop: 4,
    } as TextStyle,
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    } as ViewStyle,

    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    } as ViewStyle,

    elevated: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    } as ViewStyle,
  });

/**
 * List 컴포넌트 스타일 생성 함수
 */
export const createListStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    } as ViewStyle,

    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    } as TextStyle,

    headerButton: {
      minWidth: 100,
    } as ViewStyle,

    listContainer: {
      padding: 8,
    } as ViewStyle,

    itemContainer: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    } as ViewStyle,

    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    } as ViewStyle,

    itemContent: {
      flex: 1,
    } as ViewStyle,

    itemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    } as TextStyle,

    itemDescription: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    } as TextStyle,

    itemPrice: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    } as TextStyle,

    itemDate: {
      fontSize: 12,
      color: colors.text,
    } as TextStyle,

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 40,
    } as ViewStyle,

    emptyText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    } as TextStyle,

    emptyButton: {
      minWidth: 120,
    } as ViewStyle,

    loadingContainer: {
      paddingVertical: 20,
      alignItems: "center",
    } as ViewStyle,

    loadingText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 8,
    } as TextStyle,
  });
