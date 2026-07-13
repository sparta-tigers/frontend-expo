import { Box, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

interface AttendanceEmptyStateProps {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AttendanceEmptyState({
  title,
  description,
  icon = "alert-circle-outline",
  iconColor,
  actionLabel = "이전 화면으로",
  onAction,
}: AttendanceEmptyStateProps) {
  const router = useRouter();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      router.replace("/(tabs)/history");
    }
  };

  return (
    <Box flex={1} justify="center" align="center" p="SCREEN">
      <Ionicons name={icon} size={64} color={iconColor || theme.colors.error} />
      <Typography
        variant="h3"
        color="text.primary"
        weight="bold"
        center
        mt="md"
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" center mt="sm">
        {description}
      </Typography>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Typography variant="body1" color="background" weight="bold">
          {actionLabel}
        </Typography>
      </TouchableOpacity>
    </Box>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: theme.colors.brand.mint,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.lg,
  },
});
