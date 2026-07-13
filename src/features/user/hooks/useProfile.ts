// app/profile/useProfile.ts
import {
  UserProfileUpdateRequest,
  usersDeleteAccountAPI,
  usersUpdateProfileAPI,
} from '@/src/features/auth';
import { FavoriteTeam } from '@/src/features/user/favorite-team';
import {
  favoriteTeamAddAPI,
  favoriteTeamDeleteAPI,
  favoriteTeamUpdateAPI,
} from '@/src/features/user/favorite-team-api';
import { favoriteTeamKeys, useFavoriteTeam } from '@/src/features/user/queries';
import { KBO_TEAMS } from '@/src/features/user/types';
import { useAuth } from '@/src/hooks/useAuth';
import { Logger } from '@/src/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useToastStore } from '@/src/store/useToastStore';
import { useConfirmStore } from '@/src/store/useConfirmStore';

/**
 * useProfile
 *
 * Why: 프로필 화면의 회원 관리, 즐겨찾기 팀 관리 비즈니스 로직을 UI와 분리.
 */
export function useProfile() {
  const { user, signout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { data: favoriteTeam } = useFavoriteTeam();
  const queryClient = useQueryClient();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const showToast = useToastStore((state) => state.showToast);
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  /**
   * 닉네임 저장 핸들러
   * Why: 불필요한 네트워크 요청을 방지하기 위해 빈 문자열 및 기존 닉네임과 동일한 경우를 Guard clause로 필터링하며,
   *      저장 완료 후 authContext의 전역 상태를 업데이트하여 앱 전체에 즉각 반영함.
   */
  const handleSaveNickname = async (newNickname: string) => {
    if (!newNickname || newNickname.trim().length === 0) {
      showToast('닉네임을 입력해주세요.', undefined, 'error');
      return;
    }

    const currentNickname = user?.nickname ?? '';
    if (currentNickname.length > 0 && newNickname.trim() === currentNickname) {
      showToast('같은 닉네임이에요.', undefined, 'info');
      return;
    }

    setLoading(true);
    try {
      const request: UserProfileUpdateRequest = {
        nickname: newNickname.trim(),
      };
      const response = await usersUpdateProfileAPI(request);
      if (response.resultType === 'SUCCESS' && response.data) {
        updateUser({ nickname: response.data.nickname });
        showToast('프로필을 수정했어요.', undefined, 'success');
        setIsEditModalVisible(false);
      } else {
        showToast('프로필을 수정하지 못했어요.', undefined, 'error');
      }
    } catch (error) {
      Logger.error('프로필 수정 실패:', error);
      showToast('네트워크에 문제가 생겼어요.', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 계정 탈퇴 핸들러
   * Why: 데이터가 영구적으로 삭제되므로 2단계 교차 확인(Alert) 로직을 통해 사용자의 실수를 방지하고,
   *      API 호출 성공 시 로컬 세션(JWT 등)을 파기(signout)하여 보안 결함을 차단함.
   */
  const handleDeleteAccount = () => {
    showConfirm(
      '회원 탈퇴',
      '회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없어요.\n\n정말 탈퇴할까요?',
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            showConfirm('최종 확인', '정말 탈퇴할까요? 탈퇴하면 이전으로 되돌릴 수 없어요.', [
              { text: '닫기', style: 'cancel' },
              {
                text: '영구 탈퇴',
                style: 'destructive',
                onPress: async () => {
                  setLoading(true);
                  try {
                    const response = await usersDeleteAccountAPI();
                    if (response.resultType === 'SUCCESS') {
                      showConfirm('탈퇴 완료', '회원 탈퇴를 완료했어요.', [
                        {
                          text: '확인',
                          onPress: async () => {
                            await signout();
                            router.replace('/(auth)/signin');
                          },
                        },
                      ]);
                    } else {
                      showToast('탈퇴 처리 중 문제가 생겼어요.', undefined, 'error');
                    }
                  } catch (error) {
                    Logger.error('회원 탈퇴 실패:', error);
                    showToast('네트워크에 문제가 생겼어요.', undefined, 'error');
                  } finally {
                    setLoading(false);
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  /**
   * 로그아웃 핸들러
   * Why: 사용자의 명시적 요청에 의한 로컬 세션 만료 처리를 안전하게 수행하며,
   *      어떤 상황에서도(네트워크 에러 포함) 로그인 화면으로 fallback되도록 finally 블록에서 라우팅함.
   */
  const handleLogout = () => {
    showConfirm('로그아웃', '정말 로그아웃할까요?', [
      { text: '닫기', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await signout();
          } catch (error) {
            Logger.error('로그아웃 실패:', error);
          } finally {
            router.replace('/(auth)/signin');
          }
        },
      },
    ]);
  };

  /**
   * 즐겨찾기 팀 선택/변경 핸들러
   * Why: 기존 팀 유무를 조회(checkRes)하여 Add/Update API를 분기함으로써
   *      단일 엔드포인트에 묶이지 않고 명시적인 비즈니스 트랜잭션을 구현함.
   */
  const handleSelectTeam = async (team: (typeof KBO_TEAMS)[number]) => {
    try {
      const teamExists = !!favoriteTeam;

      const response = teamExists
        ? await favoriteTeamUpdateAPI({ teamCode: team.code })
        : await favoriteTeamAddAPI({ teamCode: team.code });

      if (response.resultType === 'SUCCESS') {
        queryClient.invalidateQueries({ queryKey: favoriteTeamKeys.mine() }).catch((err) => {
          Logger.error('즐겨찾기 캐시 무효화 실패 (서버 저장은 성공):', err);
        });
        showToast(
          `${team.name}을 즐겨찾기에 ${teamExists ? '변경' : '추가'}했어요.`,
          undefined,
          'success',
        );
      } else {
        showToast(`즐겨찾기 ${teamExists ? '변경' : '추가'}하지 못했어요.`, undefined, 'error');
      }
    } catch (error) {
      Logger.error('즐겨찾기 팀 처리 실패:', error);
      showToast('네트워크에 문제가 생겼어요.', undefined, 'error');
    }
  };

  /**
   * 즐겨찾기 팀 삭제 핸들러
   * Why: 명시적인 삭제 의도를 확인한 후 상태를 갱신(loadFavoriteTeam)하여,
   *      로컬 상태와 리모트 상태의 불일치를 최소화함.
   */
  const handleDeleteFavoriteTeam = (team: FavoriteTeam) => {
    showConfirm('즐겨찾기 팀 삭제', `${team.teamName}을 즐겨찾기에서 삭제할까요?`, [
      { text: '닫기', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await favoriteTeamDeleteAPI();
            if (response.resultType === 'SUCCESS') {
              queryClient.invalidateQueries({ queryKey: favoriteTeamKeys.mine() }).catch((err) => {
                Logger.error('즐겨찾기 삭제 캐시 무효화 실패 (서버 삭제는 성공):', err);
              });
              showToast(`${team.teamName}을 즐겨찾기에서 삭제했어요.`, undefined, 'success');
            } else {
              showToast('즐겨찾기에서 삭제하지 못했어요.', undefined, 'error');
            }
          } catch (error) {
            Logger.error('즐겨찾기 팀 삭제 실패:', error);
            showToast('네트워크에 문제가 생겼어요.', undefined, 'error');
          }
        },
      },
    ]);
  };

  return {
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
  };
}
