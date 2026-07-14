/**
 * 교환 화면 프로필 모달 컴포넌트
 *
 * "내 활동 관리" 바텀 모달 (내가 등록한 물건 / 종료된 교환 내역)
 */
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/src/styles/theme';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MODAL_LAYOUT = {
  handleWidth: 40,
  handleHeight: 4,
  handleRadius: 2,
} as const;

interface ExchangeProfileModalProps {
  modalRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
}

export const ExchangeProfileModal = React.memo(
  ({ modalRef, onClose }: ExchangeProfileModalProps) => {
    const router = useRouter();
    useTheme();

    const handleNavigate = (path: Href) => {
      onClose();
      modalRef.current?.dismiss();
      router.push(path);
    };

    const renderBackdrop = React.useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          onPress={onClose}
        />
      ),
      [onClose],
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        index={0}
        snapPoints={['30%']}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        handleIndicatorStyle={styles.modalHandle}
        backgroundStyle={styles.modalContent}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
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
        </View>
      </BottomSheetModal>
    );
  },
);

ExchangeProfileModal.displayName = 'ExchangeProfileModal';

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  modalContainer: {
    paddingHorizontal: theme.spacing.SCREEN,
    paddingBottom: theme.spacing.xxl,
  },
  modalHeader: {
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalMenuButtonText: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
  },
  menuArrow: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.size.md,
  },
});
