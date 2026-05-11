// app/profile/useProfile.ts
import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { Logger } from "@/src/utils/logger";
import {
  usersDeleteAccountAPI,
  usersUpdateProfileAPI,
} from "@/src/features/auth/api";
import { UserProfileUpdateRequest } from "@/src/features/auth/types";
import { FavoriteTeam } from "@/src/features/user/favorite-team";
import {
  favoriteTeamAddAPI,
  favoriteTeamDeleteAPI,
  favoriteTeamGetAPI,
  favoriteTeamUpdateAPI,
} from "@/src/features/user/favorite-team-api";
import { TEAM_DATA } from "@/src/utils/team";

export const KBO_TEAMS = Object.entries(TEAM_DATA).map(([_, team]) => ({
  name: team.name,
  code: team.backendCode,
}));

/**
 * useProfile
 * 
 * Why: 프로필 화면의 회원 관리, 즐겨찾기 팀 관리 비즈니스 로직을 UI와 분리.
 */
export function useProfile() {
  const { user, signout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState<FavoriteTeam | null>(null);

  const loadFavoriteTeam = useCallback(async () => {
    if (!user?.accessToken) return;

    try {
      const response = await favoriteTeamGetAPI();
      if (response.resultType === "SUCCESS" && response.data) {
        setFavoriteTeam(response.data);
      } else {
        setFavoriteTeam(null);
      }
    } catch (error) {
      Logger.error("즐겨찾기 팀 정보 로딩 실패:", error);
    }
  }, [user?.accessToken]);

  useEffect(() => {
    loadFavoriteTeam();
  }, [loadFavoriteTeam]);

  const handleEditProfile = () => {
    Alert.prompt(
      "프로필 수정",
      "새로운 닉네임을 입력하세요",
      [
        { text: "취소", style: "cancel" },
        {
          text: "수정",
          onPress: async (newNickname?: string) => {
            if (!newNickname || newNickname.trim().length === 0) {
              Alert.alert("오류", "닉네임을 입력해주세요.");
              return;
            }

            const currentNickname = user?.nickname ?? "";
            if (currentNickname.length > 0 && newNickname.trim() === currentNickname) {
              Alert.alert("알림", "동일한 닉네임입니다.");
              return;
            }

            setLoading(true);
            try {
              const request: UserProfileUpdateRequest = {
                nickname: newNickname.trim(),
              };
              const response = await usersUpdateProfileAPI(request);
              if (response.resultType === "SUCCESS" && response.data) {
                updateUser({ nickname: response.data.nickname });
                Alert.alert("성공", "프로필이 성공적으로 수정되었습니다.");
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "⚠️ 경고: 회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.\n\n정말 탈퇴하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "최종 확인",
              "정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "영구 탈퇴",
                  style: "destructive",
                  onPress: async () => {
                    setLoading(true);
                    try {
                      const response = await usersDeleteAccountAPI();
                      if (response.resultType === "SUCCESS") {
                        Alert.alert("탈퇴 완료", "회원 탈퇴가 완료되었습니다.", [
                          {
                            text: "확인",
                            onPress: async () => {
                              await signout();
                              router.replace("/(auth)/signin");
                            },
                          },
                        ]);
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

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
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

  const handleSelectTeam = async (team: (typeof KBO_TEAMS)[number]) => {
    try {
      const checkRes = await favoriteTeamGetAPI();
      const teamExists = checkRes.resultType === "SUCCESS" && !!checkRes.data;

      const response = teamExists
        ? await favoriteTeamUpdateAPI({ teamCode: team.code })
        : await favoriteTeamAddAPI({ teamCode: team.code });

      if (response.resultType === "SUCCESS") {
        Alert.alert("성공", `${team.name}을 즐겨찾기에 ${teamExists ? "변경" : "추가"}했습니다.`);
        loadFavoriteTeam();
      } else {
        Alert.alert("오류", `즐겨찾기 ${teamExists ? "변경" : "추가"}에 실패했습니다.`);
      }
    } catch (error) {
      Logger.error("즐겨찾기 팀 처리 실패:", error);
      Alert.alert("오류", "네트워크 에러가 발생했습니다.");
    }
  };

  const handleDeleteFavoriteTeam = (team: FavoriteTeam) => {
    Alert.alert(
      "즐겨찾기 팀 삭제",
      `${team.teamName}을 즐겨찾기에서 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await favoriteTeamDeleteAPI();
              if (response.resultType === "SUCCESS") {
                Alert.alert("성공", `${team.teamName}을 즐겨찾기에서 삭제했습니다.`);
                loadFavoriteTeam();
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

  return {
    user,
    loading,
    favoriteTeam,
    handleEditProfile,
    handleDeleteAccount,
    handleLogout,
    handleSelectTeam,
    handleDeleteFavoriteTeam,
  };
}
