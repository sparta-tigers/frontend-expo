import { useAuth } from "@/src/hooks/useAuth";
import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Redirect } from "expo-router";

/**
 * 로그인 페이지
 * 이메일과 비밀번호로 로그인하는 컴포넌트
 */
export default function SigninScreen() {
  const { signin, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleSignin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요");
      return;
    }

    try {
      const success = await signin({ email, password });
      if (success) {
        Alert.alert("성공", "로그인되었습니다");
        setIsSignedIn(true);
      } else {
        Alert.alert("실패", "로그인에 실패했습니다");
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      Alert.alert("오류", "로그인 중 오류가 발생했습니다");
    }
  };

  // 로그인 성공 시 자동 리다이렉트
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        로그인
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
        onPress={handleSignin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "bold" }}>로그인</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
