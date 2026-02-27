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
 * 로그인 페이지
 * 이메일과 비밀번호로 로그인하는 컴포넌트
 */
export default function SigninScreen() {
  const { signin, isLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요");
      return;
    }

    try {
      const success = await signin({ email, password });
      if (success) {
        Alert.alert("성공", "로그인되었습니다");
        router.replace("/(tabs)");
      } else {
        Alert.alert("실패", "로그인에 실패했습니다");
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      Alert.alert("오류", "로그인 중 오류가 발생했습니다");
    }
  };

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <View style={styles.contentContainer}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text }]}>로그인</Text>

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            keyboardType="email-address"
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
            onPress={handleSignin}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.button}
          >
            로그인
          </Button>

          <Button
            onPress={() => router.push("/(auth)/signup")}
            variant="ghost"
            style={styles.linkButton}
          >
            회원가입하기
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
