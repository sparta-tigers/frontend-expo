// src/features/exchange/components/ExchangeProfileModal.tsx
/**
 * @file ExchangeProfileModal.tsx
 * @description 내 활동 관리 프로필 모달 (React Native 기본 Modal 사용)
 */
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/src/styles/theme';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    useTheme();

    const handleNavigate = (path: Href) => {
      onClose();
      router.push(path);
    };

    return (
      <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>내 활동 관리</Text>
            </View>

            <TouchableOpacity
              style={styles.modalMenuButton}
              onPress={() => handleNavigate('/exchange/my-items')}
            >
              <Text style={styles.modalMenuButtonText}>내가 등록한 물건</Text>
              <Text style={styles.menuArrow}>{'>'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalMenuButton}
              onPress={() => handleNavigate('/exchange/history')}
            >
              <Text style={styles.modalMenuButtonText}>종료된 교환 내역</Text>
              <Text style={styles.menuArrow}>{'>'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);

ExchangeProfileModal.displayName = 'ExchangeProfileModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.SCREEN,
    paddingBottom: theme.spacing.xxl,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
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
    fontWeight: theme.typography.weight.BOLD,
    color: theme.colors.text.primary,
  },
  modalMenuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalMenuButtonText: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.text.primary,
  },
  menuArrow: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.text.tertiary,
  },
});
