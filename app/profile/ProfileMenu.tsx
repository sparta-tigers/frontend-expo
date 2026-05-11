// app/profile/ProfileMenu.tsx
import React from "react";
import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { styles } from "./profile.styles";

interface MenuItemProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isError?: boolean;
}

export function MenuItem({ label, onPress, disabled, isError }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Typography color={isError ? "error" : "text.primary"}>{label}</Typography>
      <Typography color={isError ? "error" : "text.secondary"} weight="bold">
        ›
      </Typography>
    </TouchableOpacity>
  );
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <Box mb="lg">
      <Typography variant="label" ml="sm" mb="sm" color="text.secondary">
        {title}
      </Typography>
      <Box bg="card" rounded="lg" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}

export const MenuDivider = () => <Box mx="lg" height={1} bg="border.medium" />;
