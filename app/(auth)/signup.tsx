import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { useAuth } from "@/src/hooks/useAuth";
import { Logger } from "@/src/utils/logger";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Box, Typography, Input, Button } from "@/components/ui";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  containerPadding: theme.spacing.SCREEN,
  cardRadius: theme.radius.lg,
  titleBottomMargin: theme.spacing.SCREEN,
  inputBottomMargin: theme.spacing.md,
  buttonTopMargin: theme.spacing.sm,
  linkButtonTopMargin: theme.spacing.md,
} as const;

/**
 * 회원가입 페이지
 * 이메일, 비밀번호, 닉네임으로 회원가입하는 컴포넌트
 */
export default function SignupScreen() {
  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const validateInputs = () => {
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      Alert.alert("오류", "모든 필드를 입력해주세요");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("오류", "올바른 이메일 형식을 입력해주세요");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("오류", "비밀번호는 최소 6자 이상이어야 합니다");
      return false;
    }

    if (nickname.length < 2) {
      Alert.alert("오류", "닉네임은 최소 2자 이상이어야 합니다");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const success = await signup({ email, password, nickname });
      if (success) {
        Alert.alert("성공", "회원가입이 완료되었습니다");
        router.replace("/(tabs)");
      } else {
        Alert.alert("실패", "회원가입에 실패했습니다");
      }
    } catch (error) {
      Logger.error(
        "회원가입 에러:",
        error instanceof Error ? error.message : String(error),
      );
      Alert.alert("오류", "회원가입 중 오류가 발생했습니다");
    }
  };

  return (
    <SafeLayout style={styles.safeLayout}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={theme.spacing.xl}
      >
        <Box bg="card" p="xl" rounded="lg" style={styles.card}>
          <Typography variant="h2" weight="bold" color="text.primary" center mb="xl">
            회원가입
          </Typography>

          <Box gap="md">
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              keyboardType="email-address"
              fullWidth
            />

            <Input
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임"
              fullWidth
            />

            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호"
              secureTextEntry
              fullWidth
            />

            <Button
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={styles.signupButton}
            >
              회원가입
            </Button>

            <Button
              onPress={() => router.push("/(auth)/signin")}
              variant="ghost"
              fullWidth
            >
              이미 계정이 있나요? 로그인하기
            </Button>
          </Box>
        </Box>
      </KeyboardAwareScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    padding: LOCAL_LAYOUT.containerPadding,
  },
  signupButton: {
    marginTop: LOCAL_LAYOUT.buttonTopMargin,
  },
  card: {
    ...theme.shadow.card,
  },
});
