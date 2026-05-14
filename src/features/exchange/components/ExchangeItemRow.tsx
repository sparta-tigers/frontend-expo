// src/features/exchange/components/ExchangeItemRow.tsx
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Box, Typography } from "@/components/ui";
import { Item } from "@/src/features/exchange/types";
import { theme } from "@/src/styles/theme";
import { getImageUrl } from "@/src/utils/url";

/** 
 * 🛠️ LOCAL_LAYOUT (Yagu-FE-Local-Layout-Pattern)
 * Why: 컴포넌트 전용 레이아웃 수치를 상수로 관리하여 매직 넘버 제거.
 */
const LOCAL_LAYOUT = {
  itemImageSize: 90,
} as const;

interface ExchangeItemRowProps {
  item: Item;
  onPress: (itemId: number) => void;
}

/**
 * ExchangeItemRow
 * 
 * Why: 교환 아이템 리스트의 개별 행 렌더링을 담당.
 * View의 복잡도를 낮추고 재사용성을 확보함.
 */
export const ExchangeItemRow = React.memo(({ item, onPress }: ExchangeItemRowProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.itemContainer}
      onPress={() => onPress(item.id)}
    >
      <Box mr="md">
        {item.imageUrl ? (
          <Image 
            source={{ uri: getImageUrl(item.imageUrl) }} 
            style={styles.itemImage} 
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <Box 
            width={LOCAL_LAYOUT.itemImageSize} 
            height={LOCAL_LAYOUT.itemImageSize} 
            bg="border.medium" 
            rounded="md" 
            align="center" 
            justify="center"
          >
            <Typography variant="caption" color="text.tertiary">이미지 없음</Typography>
          </Box>
        )}
      </Box>

      <Box flex={1} justify="space-between">
        <Box>
          <Typography
            variant="body2"
            weight="bold"
            color="text.primary"
            numberOfLines={1}
          >
            {item.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            numberOfLines={2}
            mt="xs"
          >
            {item.description}
          </Typography>
        </Box>
        <Box flexDir="row" justify="space-between" align="center">
          <Typography variant="caption" color="primary" weight="semibold">
            {item.category === "TICKET" ? "티켓" : "굿즈"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(item.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
    </TouchableOpacity>
  );
});

ExchangeItemRow.displayName = "ExchangeItemRow";

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.surface,
  },
  itemImage: {
    width: LOCAL_LAYOUT.itemImageSize,
    height: LOCAL_LAYOUT.itemImageSize,
    borderRadius: theme.radius.md,
  },
});
