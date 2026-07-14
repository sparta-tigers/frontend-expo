import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeLayout } from '@/components/ui/safe-layout';
import { itemsGetDetailAPI, itemsUpdateAPI } from '@/src/features/exchange/api';
import { UpdateItemRequest } from '@/src/features/exchange/types';
import { useAuth } from '@/src/hooks/useAuth';
import { SPACING, theme } from '@/src/styles/theme';
import { Logger } from '@/src/utils/logger';
import { getImageUrl } from '@/src/utils/url';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exchangeKeys } from '@/src/features/exchange/keys';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToastStore } from '@/src/store/useToastStore';
import { useConfirmStore } from '@/src/store/useConfirmStore';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.SCREEN,
  },
  errorText: {
    fontSize: 16,
    marginBottom: SPACING.SCREEN,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  imageCard: {
    marginBottom: SPACING.SCREEN,
    marginHorizontal: SPACING.SCREEN,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border.medium,
  },
  itemImage: {
    width: '100%',
    height: 200, // 도메인 특화 수치 유지
    borderRadius: theme.radius.md,
  },
  formCard: {
    margin: SPACING.SCREEN,
    padding: SPACING.SCREEN,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.COMPONENT,
    color: theme.colors.text.primary,
  },
  inputContainer: {
    marginBottom: SPACING.COMPONENT,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SPACING.SMALL,
    color: theme.colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    fontSize: theme.typography.size.md,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border.medium,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: 120, // 도메인 특화 수치 유지
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: SPACING.SMALL,
  },
  categoryButton: {
    flex: 1,
    padding: SPACING.SMALL,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border.medium,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  categoryTextActive: {
    color: theme.colors.background,
  },
  actionContainer: {
    padding: SPACING.SCREEN,
    paddingTop: 0,
  },
  saveButton: {
    marginBottom: SPACING.SMALL,
  },
});

/**
 * 아이템 수정 페이지 컴포넌트
 *
 * 기존 아이템 정보를 불러와 수정하는 기능
 * - 아이템 정보 수정
 */
export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const showToast = useToastStore((state) => state.showToast);
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  // React Query로 아이템 상세 정보 가져오기
  const {
    data: itemResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: exchangeKeys.item(id as string),
    queryFn: () => itemsGetDetailAPI(Number(id)),
    enabled: !!id,
  });

  const item = itemResponse?.data;

  // 폼 상태 - defaultValues 주입
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState<'TICKET' | 'GOODS'>(item?.category || 'GOODS');

  // 아이템 데이터가 로드된 후 폼 초기화
  const [prevItem, setPrevItem] = useState(item);
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setCategory(item.category);
    }
  }

  const queryClient = useQueryClient();

  // 아이템 수정 Mutation
  const updateItemMutation = useMutation({
    mutationFn: (request: UpdateItemRequest) => itemsUpdateAPI(Number(id), request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: exchangeKeys.item(id as string),
        }),
        queryClient.invalidateQueries({ queryKey: exchangeKeys.items() }),
      ]);

      showConfirm('수정 완료', '아이템을 수정했어요.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Logger.error('아이템 수정 실패:', error);
      showToast('아이템을 수정하지 못했어요.', undefined, 'error');
    },
  });

  // 아이템 수정 핸들러
  const handleUpdateItem = useCallback(() => {
    if (!item || !user?.accessToken) {
      showToast('먼저 로그인하시거나, 올바른 아이템인지 확인해주세요.', undefined, 'error');
      return;
    }

    // 본인 아이템인지 확인 - 강화된 권한 검증
    if (!user?.userId || !item?.userId) {
      showToast('사용자 정보를 찾지 못했어요. 다시 로그인해주세요.', undefined, 'error');
      return;
    }

    if (item.userId !== user.userId) {
      showToast('본인의 아이템만 수정할 수 있어요.', undefined, 'error');
      Logger.debug('[권한 오류] 아이템 소유자 불일치:', {
        itemUserId: item.userId,
        currentUserId: user.userId,
        itemUserNickname: item.user?.userNickname,
        currentUserEmail: user?.email,
      });
      return;
    }

    // 유효성 검사
    if (!title.trim()) {
      showToast('제목을 입력해주세요.', undefined, 'info');
      return;
    }

    if (!description.trim()) {
      showToast('설명을 입력해주세요.', undefined, 'info');
      return;
    }

    showConfirm('아이템 수정', '이 아이템을 수정할까요?', [
      {
        text: '닫기',
        style: 'cancel',
      },
      {
        text: '수정',
        style: 'default',
        onPress: () => {
          const request: UpdateItemRequest = {
            category: category,
            title: title.trim(),
            description: description.trim(),
          };
          updateItemMutation.mutate(request);
        },
      },
    ]);
  }, [item, user, title, description, category, updateItemMutation, showToast, showConfirm]);

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeLayout edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>아이템 정보를 불러오는 중...</Text>
        </View>
      </SafeLayout>
    );
  }

  // 에러 상태
  if (error || !item) {
    return (
      <SafeLayout edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>아이템 정보를 불러오지 못했어요.</Text>
          <Button
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/exchange');
              }
            }}
          >
            돌아가기
          </Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          {/* 아이템 이미지 */}
          {item.imageUrl ? (
            <Card style={styles.imageCard}>
              <Image
                source={{ uri: getImageUrl(item.imageUrl) }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            </Card>
          ) : null}

          {/* 수정 폼 */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>아이템 정보 수정</Text>

            {/* 제목 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>제목</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="아이템 제목을 입력하세요"
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
              />
            </View>

            {/* 카테고리 선택 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>카테고리</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    category === 'TICKET' && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory('TICKET')}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === 'TICKET' && styles.categoryTextActive,
                    ]}
                  >
                    경기 티켓
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    category === 'GOODS' && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory('GOODS')}
                >
                  <Text
                    style={[styles.categoryText, category === 'GOODS' && styles.categoryTextActive]}
                  >
                    굿즈/상품
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 설명 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>설명</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="아이템 상세 설명을 입력하세요"
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </Card>

          {/* 액션 버튼 */}
          <View style={styles.actionContainer}>
            <Button
              variant="primary"
              onPress={handleUpdateItem}
              loading={updateItemMutation.isPending}
              style={styles.saveButton}
              fullWidth
            >
              아이템 수정
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeLayout>
  );
}
