// app/profile/NicknameEditModal.tsx
import { Box, Button, Input, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { animateLayout } from "@/src/utils/motion";

interface NicknameEditModalProps {
  visible: boolean;
  initialNickname: string;
  loading: boolean;
  onClose: () => void;
  onSave: (newNickname: string) => void;
}

export function NicknameEditModal({
  visible,
  initialNickname,
  loading,
  onClose,
  onSave,
}: NicknameEditModalProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [errorText, setErrorText] = useState("");

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setNickname(initialNickname);
      setErrorText("");
    }
  }

  const onChangeText = (text: string) => {
    setNickname(text);
    if (errorText) {
      animateLayout();
      setErrorText("");
    }
  };

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length < 2) {
      animateLayout();
      setErrorText("닉네임은 2자 이상 입력해주세요.");
      return;
    }
    onSave(trimmed);
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
              <Box style={styles.content}>
                <Typography variant="h3" weight="bold" color="text.primary" mb="xs" center>
                  프로필 수정
                </Typography>
                <Typography variant="body2" color="text.secondary" mb="xl" center>
                  새로운 닉네임을 입력하세요
                </Typography>

                <Box mb="xxl">
                  <Input
                    value={nickname}
                    onChangeText={onChangeText}
                    placeholder="닉네임 입력 (2자 이상)"
                    error={!!errorText}
                    fullWidth
                    style={styles.input}
                  />
                  {!!errorText && (
                    <Typography variant="caption" color="error" mt="xs" ml="xs">
                      {errorText}
                    </Typography>
                  )}
                </Box>

                <Box flexDir="row" justify="space-between" gap="md">
                  <Button
                    variant="outline"
                    onPress={onClose}
                    disabled={loading}
                    style={styles.button}
                  >
                    취소
                  </Button>
                  <Button
                    onPress={handleSave}
                    disabled={!nickname.trim() || loading}
                    loading={loading}
                    style={styles.button}
                  >
                    수정
                  </Button>
                </Box>
              </Box>
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
    ...theme.shadow.button,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  button: {
    flex: 1,
  },
});

