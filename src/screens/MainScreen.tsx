import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * 메인 스크린 컴포넌트
 * 앱의 첫 화면을 담당
 */
const MainScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>스파르타 �이거즈</Text>
      <Text style={styles.subtitle}>Expo 앱에 오신 것을 환영합니다!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default MainScreen;
