import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SafeLayout } from "@/components/ui/safe-layout";
import { FONT_SIZE, SPACING } from "@/constants/layout";
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
    <SafeLayout style={{ backgroundColor }}>
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
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            앱 설정
          </Text>

          <TouchableOpacity
            style={[styles.menuItem, { borderColor }]}
            onPress={() =>
              Alert.alert("알림", "알림 설정 기능은 준비 중입니다.")
            }
          >
            <Text style={[styles.menuItemText, { color: textColor }]}>
              알림 설정
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderColor }]}
            onPress={() =>
              Alert.alert("알림", "테마 설정 기능은 준비 중입니다.")
            }
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
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.SCREEN,
    gap: SPACING.SCREEN,
  },
  title: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: SPACING.SCREEN,
  },
  card: {
    padding: SPACING.SCREEN,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.SCREEN,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.COMPONENT,
  },
  avatarText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.TINY,
  },
  userEmail: {
    fontSize: FONT_SIZE.SMALL,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.COMPONENT,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.COMPONENT,
    paddingHorizontal: SPACING.TINY,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: FONT_SIZE.BODY,
  },
  logoutButton: {
    marginTop: SPACING.SCREEN,
  },
});
