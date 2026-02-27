import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import {
    usersDeleteAccountAPI,
    usersUpdateProfileAPI,
} from "@/src/features/auth/api";
import { UserProfileUpdateRequest } from "@/src/features/auth/types";
import { useAuth } from "@/src/hooks/useAuth";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signout } = useAuth();
  const [loading, setLoading] = useState(false);

  // 프로필 수정 핸들러
  const handleEditProfile = () => {
    Alert.prompt(
      "프로필 수정",
      "새로운 닉네임을 입력하세요",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "수정",
          onPress: async (newNickname?: string) => {
            if (!newNickname || newNickname.trim().length === 0) {
              Alert.alert("오류", "닉네임을 입력해주세요.");
              return;
            }

            // 임시로 사용자 이메일을 닉네임 대신 사용 (SimpleToken 타입에는 nickname이 없음)
            const currentNickname = user?.email.split("@")[0] || "";
            if (newNickname.trim() === currentNickname) {
              Alert.alert("알림", "동일한 닉네임입니다.");
              return;
            }

            setLoading(true);
            try {
              const request: UserProfileUpdateRequest = {
                nickname: newNickname.trim(),
              };

              const response = await usersUpdateProfileAPI(request);

              if (response.resultType === "SUCCESS") {
                Alert.alert("성공", "프로필이 성공적으로 수정되었습니다.", [
                  {
                    text: "확인",
                    onPress: () => {
                      // 프로필 정보 새로고침을 위해 로그아웃 후 재로그인 유도
                      // 또는 useAuth 훅에서 사용자 정보 업데이트 로직 추가
                      router.replace("/(auth)/signin");
                    },
                  },
                ]);
              } else {
                Alert.alert("오류", "프로필 수정에 실패했습니다.");
              }
            } catch (error) {
              console.error("프로필 수정 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      "plain-text",
      user?.nickname || "",
    );
  };

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "⚠️ 경고: 회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.\n\n정말 탈퇴하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            // 최종 확인
            Alert.alert(
              "최종 확인",
              "정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
              [
                {
                  text: "취소",
                  style: "cancel",
                },
                {
                  text: "영구 탈퇴",
                  style: "destructive",
                  onPress: async () => {
                    setLoading(true);
                    try {
                      const response = await usersDeleteAccountAPI();

                      if (response.resultType === "SUCCESS") {
                        Alert.alert(
                          "탈퇴 완료",
                          "회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.",
                          [
                            {
                              text: "확인",
                              onPress: async () => {
                                await signout();
                                router.replace("/(auth)/signin");
                              },
                            },
                          ],
                        );
                      } else {
                        Alert.alert("오류", "회원 탈퇴에 실패했습니다.");
                      }
                    } catch (error) {
                      console.error("회원 탈퇴 실패:", error);
                      Alert.alert("오류", "네트워크 에러가 발생했습니다.");
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await signout();
          router.replace("/(auth)/signin");
        },
      },
    ]);
  };

  // 로그인되지 않은 상태
  if (!user?.accessToken) {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.container}>
          {/* 상단 네비게이션 */}
          <View style={[styles.topNav, { borderBottomColor: colors.border }]}>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              ←
            </Button>
            <Text style={[styles.navTitle, { color: colors.text }]}>
              프로필
            </Text>
            <View style={styles.navSpacer} />
          </View>

          {/* 게스트 상태 콘텐츠 */}
          <View style={styles.content}>
            <View style={[styles.guestCard, { backgroundColor: colors.card }]}>
              <View
                style={[styles.guestAvatar, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  G
                </Text>
              </View>
              <Text style={[styles.guestTitle, { color: colors.text }]}>
                게스트 모드
              </Text>
              <Text style={[styles.guestDesc, { color: colors.muted }]}>
                로그인하면 더 많은 기능을 이용할 수 있어요
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <Button
                variant="primary"
                style={styles.primaryButton}
                onPress={() => router.push("/(auth)/signin")}
              >
                로그인
              </Button>
              <Button
                variant="outline"
                style={styles.outlineButton}
                onPress={() => router.push("/(auth)/signup")}
              >
                회원가입
              </Button>
            </View>
          </View>
        </View>
      </SafeLayout>
    );
  }

  // 로그인된 상태
  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <View style={styles.container}>
        {/* 상단 네비게이션 */}
        <View style={[styles.topNav, { borderBottomColor: colors.border }]}>
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            ←
          </Button>
          <Text style={[styles.navTitle, { color: colors.text }]}>프로필</Text>
          <View style={styles.navSpacer} />
        </View>

        {/* 사용자 정보 */}
        <View style={styles.content}>
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <View
                style={[styles.userAvatar, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.avatarText, { color: colors.background }]}>
                  U
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  로그인된 사용자
                </Text>
                <Text style={[styles.userStatus, { color: colors.muted }]}>
                  활성 상태
                </Text>
              </View>
            </View>
          </View>

          {/* 메뉴 그룹 */}
          <View style={styles.menuGroup}>
            <Text style={[styles.menuGroupTitle, { color: colors.text }]}>
              교환 관리
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/(tabs)/exchange")}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  내 티켓 목록
                </Text>
                <Text style={[styles.menuItemArrow, { color: colors.muted }]}>
                  ›
                </Text>
              </TouchableOpacity>
              <View
                style={[styles.menuDivider, { backgroundColor: colors.border }]}
              />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/exchange/create")}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  티켓 등록하기
                </Text>
                <Text style={[styles.menuItemArrow, { color: colors.muted }]}>
                  ›
                </Text>
              </TouchableOpacity>
              <View
                style={[styles.menuDivider, { backgroundColor: colors.border }]}
              />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/chat/chat")}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  채팅방 목록
                </Text>
                <Text style={[styles.menuItemArrow, { color: colors.muted }]}>
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.menuGroup}>
            <Text style={[styles.menuGroupTitle, { color: colors.text }]}>
              계정 관리
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEditProfile}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  프로필 수정
                </Text>
                <Text style={[styles.menuItemArrow, { color: colors.muted }]}>
                  ›
                </Text>
              </TouchableOpacity>
              <View
                style={[styles.menuDivider, { backgroundColor: colors.border }]}
              />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteAccount}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.menuItemText, { color: colors.destructive }]}
                >
                  회원 탈퇴
                </Text>
                <Text
                  style={[styles.menuItemArrow, { color: colors.destructive }]}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.menuGroup}>
            <Text style={[styles.menuGroupTitle, { color: colors.text }]}>
              설정
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  알림 설정
                </Text>
                <Text style={[styles.menuItemArrow, { color: colors.muted }]}>
                  ›
                </Text>
              </TouchableOpacity>
              <View
                style={[styles.menuDivider, { backgroundColor: colors.border }]}
              />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  테마 설정
                </Text>
                <Text style={[styles.menuItemArrow, { color: colors.muted }]}>
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 로그아웃 버튼 */}
          <Button
            variant="ghost"
            style={[styles.logoutButton, { borderColor: colors.destructive }]}
            onPress={handleLogout}
          >
            <Text
              style={[styles.logoutButtonText, { color: colors.destructive }]}
            >
              로그아웃
            </Text>
          </Button>
        </View>
      </View>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 상단 네비게이션
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.SCREEN,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  navSpacer: {
    width: 40, // 버튼과 동일한 너비로 정렬 맞춤
  },
  // 콘텐츠 영역
  content: {
    flex: 1,
    padding: SPACING.SCREEN,
  },
  // 게스트 상태
  guestCard: {
    borderRadius: 16,
    padding: SPACING.SCREEN * 1.5,
    alignItems: "center",
    marginBottom: SPACING.SCREEN * 2,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.COMPONENT,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  guestDesc: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  // 액션 버튼들
  actionButtons: {
    gap: SPACING.COMPONENT,
  },
  primaryButton: {},
  outlineButton: {},
  // 로그인된 상태
  profileCard: {
    borderRadius: 16,
    padding: SPACING.SCREEN,
    marginBottom: SPACING.SCREEN,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.COMPONENT,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 14,
  },
  // 메뉴 그룹
  menuGroup: {
    marginBottom: SPACING.SCREEN,
  },
  menuGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
    paddingHorizontal: SPACING.SMALL,
  },
  menuCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.COMPONENT,
    paddingHorizontal: SPACING.SCREEN,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuItemArrow: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuDivider: {
    height: 1,
    marginHorizontal: SPACING.SCREEN,
  },
  // 로그아웃 버튼
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: SPACING.COMPONENT,
    marginTop: SPACING.SMALL,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
