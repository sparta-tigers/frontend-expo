// app/profile.tsx
// Why: Expo Router 프로필 라우트 파일. UI와 로직을 하위 모듈로 분리하여 500+ LoC Fat File 문제 해결.
import { Box, Button, SafeLayout, Typography } from "@/components/ui";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useRef } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import {
  MenuDivider,
  MenuItem,
  MenuSection,
} from "@/src/features/user/components/ProfileMenu";
import { TeamSelectSheet } from "@/src/features/user/components/TeamSelectSheet";
import { NicknameEditModal } from "@/src/features/user/components/NicknameEditModal";
import { LOCAL_LAYOUT, styles } from "@/src/features/user/styles/profile.styles";
import { useProfile } from "@/src/features/user/hooks/useProfile";
import { KBO_TEAMS } from "@/src/features/user/types";
import { Logger } from "@/src/utils/logger";

export default function ProfileScreen() {
  const {
    user,
    loading,
    favoriteTeam,
    isEditModalVisible,
    setIsEditModalVisible,
    handleEditProfile,
    handleSaveNickname,
    handleDeleteAccount,
    handleLogout,
    handleSelectTeam,
    handleDeleteFavoriteTeam,
  } = useProfile();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const onAddFavoriteTeam = () => {
    bottomSheetModalRef.current?.present();
  };

  const onSelectTeam = (team: (typeof KBO_TEAMS)[number]) => {
    bottomSheetModalRef.current?.dismiss();
    handleSelectTeam(team).catch((err) => Logger.error("[Profile] Team select failed", err));
  };

  // 로그인되지 않은 상태 (게스트 모드)
  if (!user?.accessToken) {
    return (
      <SafeLayout>
        <Box flex={1}>
          <Box
            py="lg"
            align="center"
            borderBottomWidth={1}
            borderColor="border.medium"
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
                bg="text.tertiary"
                rounded="full"
                align="center"
                justify="center"
                mb="md"
                width={LOCAL_LAYOUT.profileAvatarSize}
                height={LOCAL_LAYOUT.profileAvatarSize}
              >
                <Typography variant="h1" color="background">G</Typography>
              </Box>
              <Typography variant="h2" mb="sm">게스트 모드</Typography>
              <Typography variant="body2" color="text.secondary" center>
                로그인하면 더 많은 기능을 이용할 수 있어요
              </Typography>
            </Box>

            <Box gap="md">
              <Button onPress={() => router.push("/(auth)/signin")}>
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
          borderBottomWidth={1}
          borderColor="border.medium"
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
                <Typography variant="caption" color="text.secondary">
                  활성 상태
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 메뉴 그룹 - 교환 관리 */}
          <MenuSection title="교환 관리">
            <MenuItem label="내 티켓 목록" onPress={() => router.push("/(tabs)/exchange")} />
            <MenuDivider />
            <MenuItem label="티켓 등록하기" onPress={() => router.push("/exchange/create")} />
            <MenuDivider />
            <MenuItem label="채팅방 목록" onPress={() => router.push("/chat/chat")} />
          </MenuSection>

          {/* 메뉴 그룹 - 계정 관리 */}
          <MenuSection title="계정 관리">
            <MenuItem label="프로필 수정" onPress={handleEditProfile} disabled={loading} />
            <MenuDivider />
            <MenuItem label="회원 탈퇴" onPress={handleDeleteAccount} disabled={loading} isError />
          </MenuSection>

          {/* 즐겨찾기 팀 */}
          <MenuSection title="즐겨찾기 팀">
            <MenuItem label="팀 추가하기" onPress={onAddFavoriteTeam} />
            {favoriteTeam && (
              <>
                <MenuDivider />
                <Box flexDir="row" align="center" justify="space-between" px="lg" py="md">
                  <Typography>{favoriteTeam.teamName}</Typography>
                  <TouchableOpacity
                    onPress={() => handleDeleteFavoriteTeam(favoriteTeam)}
                    style={styles.deleteButton}
                  >
                    <Typography variant="caption" color="error" weight="bold">
                      삭제
                    </Typography>
                  </TouchableOpacity>
                </Box>
              </>
            )}
          </MenuSection>

          {/* 설정 */}
          <MenuSection title="설정">
            <MenuItem label="알림 설정" onPress={() => {}} />
            <MenuDivider />
            <MenuItem label="테마 설정" onPress={() => {}} />
          </MenuSection>

          {/* 로그아웃 버튼 */}
          <Button
            variant="ghost"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            로그아웃
          </Button>
        </ScrollView>
      </Box>

      {/* 즐겨찾기 팀 선택 바텀 시트 */}
      <TeamSelectSheet modalRef={bottomSheetModalRef} onSelectTeam={onSelectTeam} />

      {/* 닉네임 수정 모달 */}
      <NicknameEditModal
        visible={isEditModalVisible}
        initialNickname={user?.nickname ?? ""}
        loading={loading}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveNickname}
      />
    </SafeLayout>
  );
}
