import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SafeLayout } from "@/components/ui/safe-layout";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/layout";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

/**
 * 회원가입 페이지
 * 이메일, 비밀번호, 닉네임으로 회원가입하는 컴포넌트
 */
export default function SignupScreen() {
  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
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
      console.error("회원가입 에러:", error);
      Alert.alert("오류", "회원가입 중 오류가 발생했습니다");
    }
  };

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <View style={styles.contentContainer}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>회원가입</Text>

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            keyboardType="email-address"
            style={styles.input}
          />

          <Input
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임"
            style={styles.input}
          />

          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            secureTextEntry
            style={styles.input}
          />

          <Button
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.button}
          >
            회원가입
          </Button>

          <Button
            onPress={() => router.push("/(auth)/signin")}
            variant="ghost"
            style={styles.linkButton}
          >
            이미 계정이 있나요? 로그인하기
          </Button>
        </Card>
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.SCREEN,
  },
  card: {
    padding: SPACING.SCREEN,
    borderRadius: BORDER_RADIUS.CARD,
  },
  title: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
    marginBottom: SPACING.SCREEN,
    textAlign: "center",
  },
  input: {
    marginBottom: SPACING.COMPONENT,
  },
  button: {
    marginTop: SPACING.SMALL,
  },
  linkButton: {
    marginTop: SPACING.COMPONENT,
  },
});
