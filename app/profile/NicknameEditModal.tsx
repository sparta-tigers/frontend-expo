// app/profile/NicknameEditModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { theme } from "@/src/styles/theme";

/**
 * NicknameEditModal Props
 */
interface NicknameEditModalProps {
  /** 모달 표시 여부 */
  visible: boolean;
  /** 현재 닉네임 (초기값) */
  initialNickname: string;
  /** 로딩 상태 (저장 중) */
  loading: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 저장 핸들러 */
  onSave: (newNickname: string) => void;
}

/**
 * NicknameEditModal
 *
 * Why: Android 환경에서 Alert.prompt가 동작하지 않는 문제를 해결하고,
 *      iOS/Android 공통으로 일관된 사용자 경험(UX)과 브랜드 디자인을 제공하기 위함.
 */
export function NicknameEditModal({
  visible,
  initialNickname,
  loading,
  onClose,
  onSave,
}: NicknameEditModalProps) {
  const [nickname, setNickname] = useState(initialNickname);

  useEffect(() => {
    if (visible) {
      setNickname(initialNickname);
    }
  }, [visible, initialNickname]);

  const handleSave = () => {
    if (!nickname || nickname.trim().length === 0) {
      return;
    }
    onSave(nickname.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.container}
            >
              <View style={styles.content}>
                <Text style={styles.title}>프로필 수정</Text>
                <Text style={styles.subtitle}>새로운 닉네임을 입력하세요</Text>

                <TextInput
                  style={styles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="닉네임 입력"
                  placeholderTextColor={theme.colors.text.tertiary}
                  autoFocus
                  maxLength={15}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      (!nickname.trim() || loading) && styles.disabledButton,
                    ]}
                    onPress={handleSave}
                    disabled={!nickname.trim() || loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? "저장 중..." : "수정"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    maxWidth: 400,
  },
  content: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xxl,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
