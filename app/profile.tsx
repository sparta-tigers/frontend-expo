import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { theme } from "@/src/styles/theme";
import {
    usersDeleteAccountAPI,
    usersUpdateProfileAPI,
} from "@/src/features/auth/api";
import { UserProfileUpdateRequest } from "@/src/features/auth/types";
import { FavoriteTeam, KBO_TEAMS } from "@/src/features/user/favorite-team";
import {
    favoriteTeamAddAPI,
    favoriteTeamDeleteAPI,
    favoriteTeamGetListAPI,
} from "@/src/features/user/favorite-team-api";
import { useAuth } from "@/src/hooks/useAuth";
import { Logger } from "@/src/utils/logger";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  guestAvatarSize: 80,
  userAvatarSize: 60,
  dividerHeight: 1,
  headerBorderWidth: 1,
  logoutBorderWidth: 1,
  menuItemVerticalPadding: theme.spacing.md,
  menuItemHorizontalPadding: theme.spacing.xl,
  teamDeletePaddingVertical: theme.spacing.xs,
  teamDeletePaddingHorizontal: theme.spacing.sm,
  scrollBottomPadding: 40,
} as const;

/**
 * 프로필 화면 컴포넌트
 * 
 * Why: 사용자의 개인 정보 관리, 즐겨찾기 팀 설정, 계정 관리 기능을 제공하기 위함.
 * Zero-Magic UI 원칙에 따라 모든 레이아웃은 Box와 Typography 프리미티브를 사용함.
 */
export default function ProfileScreen() {
  const { user, signout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);

  // 즐겨찾기 팀 목록 로드
  const loadFavoriteTeams = React.useCallback(async () => {
    if (!user?.accessToken) return;

    try {
      const response = await favoriteTeamGetListAPI();
      if (response.resultType === "SUCCESS" && response.data) {
        setFavoriteTeams(response.data);
      }
    } catch (error) {
      Logger.error("즐겨찾기 팀 목록 로딩 실패:", error);
    }
  }, [user?.accessToken]);

  React.useEffect(() => {
    loadFavoriteTeams();
  }, [loadFavoriteTeams]);

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

            const currentNickname = user?.nickname ?? "";
            if (
              currentNickname.length > 0 &&
              newNickname.trim() === currentNickname
            ) {
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
                      router.replace("/(auth)/signin");
                    },
                  },
                ]);
              } else {
                Alert.alert("오류", "프로필 수정에 실패했습니다.");
              }
            } catch (error) {
              Logger.error("프로필 수정 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      "plain-text",
      user?.nickname ?? "",
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
                      Logger.error("회원 탈퇴 실패:", error);
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

  // 로그아웃 핸들러
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

  // 즐겨찾기 팀 추가 핸들러
  const handleAddFavoriteTeam = () => {
    const teamOptions = KBO_TEAMS.map((team) => ({
      text: team.name,
      onPress: async () => {
        try {
          const response = await favoriteTeamAddAPI({
            teamName: team.name,
            teamCode: team.code,
          });

          if (response.resultType === "SUCCESS") {
            Alert.alert("성공", `${team.name}을 즐겨찾기에 추가했습니다.`);
            loadFavoriteTeams();
          } else {
            Alert.alert("오류", "즐겨찾기 추가에 실패했습니다.");
          }
        } catch (error) {
          Logger.error("즐겨찾기 팀 추가 실패:", error);
          Alert.alert("오류", "네트워크 에러가 발생했습니다.");
        }
      },
    }));

    Alert.alert("즐겨찾기 팀 추가", "추가할 팀을 선택하세요", [
      ...teamOptions,
      { text: "취소", style: "cancel" },
    ]);
  };

  // 즐겨찾기 팀 삭제 핸들러
  const handleDeleteFavoriteTeam = (team: FavoriteTeam) => {
    Alert.alert(
      "즐겨찾기 팀 삭제",
      `${team.teamName}을 즐겨찾기에서 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await favoriteTeamDeleteAPI(team.id);

              if (response.resultType === "SUCCESS") {
                Alert.alert(
                  "성공",
                  `${team.teamName}을 즐겨찾기에서 삭제했습니다.`,
                );
                loadFavoriteTeams();
              } else {
                Alert.alert("오류", "즐겨찾기 삭제에 실패했습니다.");
              }
            } catch (error) {
              Logger.error("즐겨찾기 팀 삭제 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            }
          },
        },
      ],
    );
  };

  // 로그인되지 않은 상태
  if (!user?.accessToken) {
    return (
      <SafeLayout>
        <Box flex={1}>
          <Box 
            py="lg" 
            align="center" 
            style={styles.header}
          >
            <Typography variant="h3">프로필</Typography>
          </Box>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Box bg="card" p="xl" rounded="xl" align="center" mb="xxl">
              <Box 
                bg="muted" 
                rounded="full" 
                align="center" 
                justify="center" 
                mb="md"
                width={LOCAL_LAYOUT.guestAvatarSize}
                height={LOCAL_LAYOUT.guestAvatarSize}
              >
                <Typography variant="h1" color="background">G</Typography>
              </Box>
              <Typography variant="h2" mb="sm">게스트 모드</Typography>
              <Typography variant="body2" color="secondary" center>
                로그인하면 더 많은 기능을 이용할 수 있어요
              </Typography>
            </Box>

            <Box gap="md">
              <Button
                variant="primary"
                onPress={() => router.push("/(auth)/signin")}
              >
                로그인
              </Button>
              <Button
                variant="outline"
                onPress={() => router.push("/(auth)/signup")}
              >
                회원가입
              </Button>
            </Box>
          </ScrollView>
        </Box>
      </SafeLayout>
    );
  }

  // 로그인된 상태
  return (
    <SafeLayout>
      <Box flex={1}>
        <Box 
          py="lg" 
          align="center" 
          style={styles.header}
        >
          <Typography variant="h3">프로필</Typography>
        </Box>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 사용자 정보 */}
          <Box bg="card" p="lg" rounded="xl" mb="lg">
            <Box flexDir="row" align="center">
              <Box 
                bg="primary" 
                rounded="full" 
                align="center" 
                justify="center" 
                mr="md"
                width={LOCAL_LAYOUT.userAvatarSize}
                height={LOCAL_LAYOUT.userAvatarSize}
              >
                <Typography variant="h3" color="background">U</Typography>
              </Box>
              <Box flex={1}>
                <Typography weight="bold" mb="xxs">
                  {user?.nickname ?? user?.email ?? ""}
                </Typography>
                <Typography variant="caption" color="secondary">
                  활성 상태
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 메뉴 그룹 - 교환 관리 */}
          <Box mb="lg">
            <Typography variant="label" ml="sm" mb="sm">교환 관리</Typography>
            <Box bg="card" rounded="lg" style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/(tabs)/exchange")}
                activeOpacity={0.7}
              >
                <Typography>내 티켓 목록</Typography>
                <Typography color="secondary" weight="bold">›</Typography>
              </TouchableOpacity>
              <Box mx="lg" style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/exchange/create")}
                activeOpacity={0.7}
              >
                <Typography>티켓 등록하기</Typography>
                <Typography color="secondary" weight="bold">›</Typography>
              </TouchableOpacity>
              <Box mx="lg" style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/chat/chat")}
                activeOpacity={0.7}
              >
                <Typography>채팅방 목록</Typography>
                <Typography color="secondary" weight="bold">›</Typography>
              </TouchableOpacity>
            </Box>
          </Box>

          {/* 메뉴 그룹 - 계정 관리 */}
          <Box mb="lg">
            <Typography variant="label" ml="sm" mb="sm">계정 관리</Typography>
            <Box bg="card" rounded="lg" style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEditProfile}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Typography>프로필 수정</Typography>
                <Typography color="secondary" weight="bold">›</Typography>
              </TouchableOpacity>
              <Box mx="lg" style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteAccount}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Typography color="destructive">회원 탈퇴</Typography>
                <Typography color="destructive" weight="bold">›</Typography>
              </TouchableOpacity>
            </Box>
          </Box>

          {/* 즐겨찾기 팀 */}
          <Box mb="lg">
            <Typography variant="label" ml="sm" mb="sm">즐겨찾기 팀</Typography>
            <Box bg="card" rounded="lg" style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleAddFavoriteTeam}
                activeOpacity={0.7}
              >
                <Typography>팀 추가하기</Typography>
                <Typography color="secondary" weight="bold">›</Typography>
              </TouchableOpacity>

              {favoriteTeams.length > 0 && (
                <>
                  <Box mx="lg" style={styles.divider} />
                  {favoriteTeams.map((team, index) => (
                    <React.Fragment key={team.id}>
                      <Box flexDir="row" align="center" justify="space-between" px="lg" py="md">
                        <Typography>{team.teamName}</Typography>
                        <TouchableOpacity
                          onPress={() => handleDeleteFavoriteTeam(team)}
                          style={styles.teamDeleteButton}
                        >
                          <Typography variant="caption" color="destructive" weight="bold">
                            삭제
                          </Typography>
                        </TouchableOpacity>
                      </Box>
                      {index < favoriteTeams.length - 1 && (
                        <Box mx="lg" style={styles.divider} />
                      )}
                    </React.Fragment>
                  ))}
                </>
              )}
            </Box>
          </Box>

          {/* 설정 */}
          <Box mb="lg">
            <Typography variant="label" ml="sm" mb="sm">설정</Typography>
            <Box bg="card" rounded="lg" style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Typography>알림 설정</Typography>
                <Typography color="secondary" weight="bold">›</Typography>
              </TouchableOpacity>
              <Box mx="lg" style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Typography>테마 설정</Typography>
                <Typography color="secondary" weight="bold">›</Typography>
              </TouchableOpacity>
            </Box>
          </Box>

          {/* 로그아웃 버튼 */}
          <Button
            variant="ghost"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Typography color="destructive" weight="bold">로그아웃</Typography>
          </Button>
        </ScrollView>
      </Box>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: LOCAL_LAYOUT.scrollBottomPadding,
  },
  header: {
    borderBottomWidth: LOCAL_LAYOUT.headerBorderWidth,
    borderBottomColor: theme.colors.border.medium,
  },
  menuCard: {
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: LOCAL_LAYOUT.menuItemVerticalPadding,
    paddingHorizontal: LOCAL_LAYOUT.menuItemHorizontalPadding,
  },
  divider: {
    height: LOCAL_LAYOUT.dividerHeight,
    backgroundColor: theme.colors.border.medium,
  },
  teamDeleteButton: {
    paddingHorizontal: LOCAL_LAYOUT.teamDeletePaddingHorizontal,
    paddingVertical: LOCAL_LAYOUT.teamDeletePaddingVertical,
  },
  logoutButton: {
    borderColor: theme.colors.error,
    borderWidth: LOCAL_LAYOUT.logoutBorderWidth,
    marginTop: theme.spacing.sm,
  },
});
