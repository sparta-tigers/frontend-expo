import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * 프로필 페이지 컴포넌트
 *
 * PWA의 사용자 정보 관리를 React Native로 구현
 * - 사용자 정보 표시
 * - 프로필 수정 기능
 * - 로그아웃 기능
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, signout } = useAuth();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => {
          signout();
          router.replace("/(auth)/signin");
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    // TODO: 프로필 수정 페이지 구현
    Alert.alert("알림", "프로필 수정 기능은 준비 중입니다.");
  };

  const handlePasswordChange = () => {
    // TODO: 비밀번호 변경 페이지 구현
    Alert.alert("알림", "비밀번호 변경 기능은 준비 중입니다.");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: textColor }]}>프로필</Text>

      {/* 사용자 정보 카드 */}
      <Card style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: borderColor }]}>
            <Text style={[styles.avatarText, { color: textColor }]}>
              {user?.accessToken ? "L" : "G"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: textColor }]}>
              {user?.accessToken ? "사용자" : "게스트"}
            </Text>
            <Text style={[styles.userEmail, { color: textColor }]}>
              {user?.accessToken ? "로그인된 사용자" : "로그인이 필요합니다"}
            </Text>
          </View>
        </View>
      </Card>

      {/* 계정 설정 카드 */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          계정 설정
        </Text>

        <TouchableOpacity
          style={[styles.menuItem, { borderColor }]}
          onPress={handleEditProfile}
        >
          <Text style={[styles.menuItemText, { color: textColor }]}>
            프로필 수정
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderColor }]}
          onPress={handlePasswordChange}
        >
          <Text style={[styles.menuItemText, { color: textColor }]}>
            비밀번호 변경
          </Text>
        </TouchableOpacity>
      </Card>

      {/* 앱 설정 카드 */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>앱 설정</Text>

        <TouchableOpacity
          style={[styles.menuItem, { borderColor }]}
          onPress={() => Alert.alert("알림", "알림 설정 기능은 준비 중입니다.")}
        >
          <Text style={[styles.menuItemText, { color: textColor }]}>
            알림 설정
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderColor }]}
          onPress={() => Alert.alert("알림", "테마 설정 기능은 준비 중입니다.")}
        >
          <Text style={[styles.menuItemText, { color: textColor }]}>
            테마 설정
          </Text>
        </TouchableOpacity>
      </Card>

      {/* 로그아웃 버튼 */}
      <Button
        variant="outline"
        fullWidth
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        로그아웃
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 20,
  },
});
