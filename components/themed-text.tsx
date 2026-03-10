import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/useTheme";
import { theme } from "@/src/styles/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor("text");
  const linkColor = useThemeColor("tint");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? [styles.link, { color: linkColor }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: theme.typography.size.md,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: theme.typography.size.md,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: theme.typography.size.TITLE,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: theme.typography.size.SECTION_TITLE,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: theme.typography.size.md,
  },
});
