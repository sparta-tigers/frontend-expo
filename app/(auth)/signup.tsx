import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/src/hooks/useAuth";
import { Redirect } from "expo-router";

/**
 * 회원가입 페이지
 * 이메일, 비밀번호, 닉네임으로 회원가입하는 컴포넌트
 */
export default function SignupScreen() {
  const { signup, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSignedUp, setIsSignedUp] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      Alert.alert("오류", "모든 필드를 입력해주세요");
      return;
    }

    try {
      const success = await signup({ email, password, nickname });
      if (success) {
        Alert.alert("성공", "회원가입이 완료되었습니다");
        setIsSignedUp(true);
      } else {
        Alert.alert("실패", "회원가입에 실패했습니다");
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      Alert.alert("오류", "회원가입 중 오류가 발생했습니다");
    }
  };

  // 회원가입 성공 시 자동 리다이렉트
  if (isSignedUp) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        회원가입
      </Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 5,
          padding: 10,
          marginBottom: 10,
          width: "100%",
        }}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 5,
          padding: 10,
          marginBottom: 10,
          width: "100%",
        }}
        placeholder="닉네임"
        value={nickname}
        onChangeText={setNickname}
      />

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 5,
          padding: 10,
          marginBottom: 20,
          width: "100%",
        }}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={{
          backgroundColor: isLoading ? "#ccc" : "#007AFF",
          padding: 15,
          borderRadius: 5,
          alignItems: "center",
        }}
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "bold" }}>회원가입</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
