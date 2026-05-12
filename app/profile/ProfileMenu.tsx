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

/**
 * MenuItem
 * 
 * Why: 프로필 화면의 각 설정 항목을 표시하는 공통 리스트 아이템 컴포넌트.
 */
export function MenuItem({ label, onPress, disabled, isError }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Typography color={isError ? "destructive" : "text.primary"}>{label}</Typography>
      <Typography color={isError ? "destructive" : "text.secondary"} weight="bold">
        ›
      </Typography>
    </TouchableOpacity>
  );
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * MenuSection
 * 
 * Why: 프로필 메뉴를 도메인(교환, 계정, 즐겨찾기 등)별로 그룹화하여 시각적 위계 제공.
 */
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
