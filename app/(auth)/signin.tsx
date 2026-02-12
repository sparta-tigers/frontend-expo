import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useTheme } from "react-native-paper";

/**
 * 로그인 페이지
 * 이메일과 비밀번호로 로그인하는 컴포넌트
 */
export default function SigninScreen() {
  const { signin, isLoading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          로그인
        </Text>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  linkButton: {
    marginTop: 16,
  },
});
