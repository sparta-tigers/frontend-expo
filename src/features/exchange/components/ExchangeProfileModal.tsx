/**
 * 교환 화면 프로필 모달 컴포넌트
 *
 * "내 활동 관리" 바텀 모달 (내가 등록한 물건 / 종료된 교환 내역)
 */
import { useTheme } from "@/hooks/useTheme";
import { theme } from "@/src/styles/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** 모달 전용 레이아웃 상수 */
const MODAL_LAYOUT = {
  handleWidth: 40,
  handleHeight: 4,
  handleRadius: 2,
} as const;

interface ExchangeProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExchangeProfileModal = React.memo(
  ({ visible, onClose }: ExchangeProfileModalProps) => {
    const router = useRouter();
    const { colors } = useTheme();

    const handleNavigate = (path: string) => {
      onClose();
      router.push(path as never);
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>내 활동 관리</Text>
            </View>

            <TouchableOpacity
              style={styles.modalMenuButton}
              onPress={() => handleNavigate("/exchange/my-items")}
            >
              <Text style={styles.modalMenuButtonText}>내가 등록한 물건</Text>
              <Text style={[{ color: colors.muted }]}>{">"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalMenuButton}
              onPress={() => handleNavigate("/exchange/history")}
            >
              <Text style={styles.modalMenuButtonText}>종료된 교환 내역</Text>
              <Text style={[{ color: colors.muted }]}>{">"}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);

ExchangeProfileModal.displayName = "ExchangeProfileModal";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.SCREEN,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    marginBottom: theme.spacing.COMPONENT,
  },
  modalHandle: {
    width: MODAL_LAYOUT.handleWidth,
    height: MODAL_LAYOUT.handleHeight,
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: MODAL_LAYOUT.handleRadius,
    marginBottom: theme.spacing.COMPONENT,
  },
  modalTitle: {
    fontSize: theme.typography.size.SECTION_TITLE,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  modalMenuButton: {
    paddingVertical: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalMenuButtonText: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
  },
});
