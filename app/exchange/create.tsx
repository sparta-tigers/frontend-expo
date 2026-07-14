import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeKeys } from '@/src/features/exchange/keys';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Box, Typography } from '@/components/ui';

import { SafeLayout } from '@/components/ui/safe-layout';
import { createExchangeItem } from '@/src/features/exchange/api';
import { useCheckActiveItem } from '@/src/features/exchange/queries';
import { ItemCategory, LocationDto } from '@/src/features/exchange/types';
import { theme } from '@/src/styles/theme';
import { Logger } from '@/src/utils/logger';
import { useToastStore } from '@/src/store/useToastStore';
import { useConfirmStore } from '@/src/store/useConfirmStore';

interface ReactNativeFile {
  uri: string;
  name: string;
  type: string;
}

export default function CreateItemScreen() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  const [formData, setFormData] = React.useState({
    title: '',
    desiredItem: '',
    content: '',
    itemCategory: 'TICKET' as ItemCategory,
  });

  const [errors, setErrors] = React.useState({
    title: '',
    content: '',
  });

  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);

  const [currentLocation, setCurrentLocation] = React.useState<LocationDto>({
    latitude: 37.5665,
    longitude: 126.978,
    address: '서울특별시',
  });
  const [locationLoading, setLocationLoading] = React.useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const requestFormData = new FormData();

      const requestData = {
        category: data.itemCategory,
        title: data.title.trim(),
        description: data.content.trim(),
        desiredItem: data.desiredItem?.trim() || '',
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address,
        },
      };

      requestFormData.append('itemRequest', JSON.stringify(requestData));

      selectedImages.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const file: ReactNativeFile = {
          uri: uri,
          name: filename,
          type,
        };

        requestFormData.append('images', file as unknown as Blob);
      });

      return createExchangeItem(requestFormData);
    },
    onSuccess: async () => {
      showToast('아이템을 등록했어요.', undefined, 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: exchangeKeys.items() }),
        queryClient.invalidateQueries({ queryKey: exchangeKeys.myItems() }),
        queryClient.invalidateQueries({ queryKey: exchangeKeys.activeCheck() }),
      ]);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/exchange');
      }
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      let errorMessage = '게시글을 등록하지 못했어요.';
      const status = error?.response?.status;

      if (status === 409) {
        errorMessage = '이미 등록한 아이템이 있어요. 계정당 하나의 아이템만 등록할 수 있어요.';
        Logger.warn('아이템 중복 등록 시도 차단 (409)');
      } else {
        Logger.error('아이템 생성 실패:', error instanceof Error ? error.message : String(error));
      }

      showToast(errorMessage, undefined, 'error');
    },
  });

  const handleSubmit = () => {
    let hasError = false;
    const newErrors = { title: '', content: '' };

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
      hasError = true;
    }
    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    mutate(formData);
  };

  const getCurrentLocation = React.useCallback(async () => {
    setLocationLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        showToast('위치 정보를 사용하려면 권한을 허용해주세요.', undefined, 'info');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationData: LocationDto = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address:
          address?.formattedAddress ||
          `${address?.city || ''} ${address?.district || ''}`.trim() ||
          '위치 정보 없음',
      };

      setCurrentLocation(locationData);
    } catch (error) {
      Logger.error('위치 정보 가져오기 실패:', error);
      showToast('위치 정보를 가져올 수 없어 기본 위치(서울)로 설정할게요.', undefined, 'info');
      const defaultLocation: LocationDto = {
        latitude: 37.5665,
        longitude: 126.978,
        address: '서울특별시',
      };
      setCurrentLocation(defaultLocation);
    } finally {
      setLocationLoading(false);
    }
  }, [showToast]);

  const { data: hasActiveItem } = useCheckActiveItem();

  React.useEffect(() => {
    const timerId = setTimeout(() => {
      getCurrentLocation().catch((err) => Logger.error('[Create] Location init failed', err));
    }, 0);
    return () => clearTimeout(timerId);
  }, [getCurrentLocation]);

  React.useEffect(() => {
    if (hasActiveItem === true) {
      showConfirm('접근 제한', '이미 등록한 아이템이 있어서 지금은 새로 작성할 수 없어요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    }
  }, [hasActiveItem, showConfirm]);

  const handleImagePicker = async () => {
    if (selectedImages.length >= 5) {
      showToast('이미지는 최대 5장까지 선택할 수 있어요.', undefined, 'info');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - selectedImages.length,
      });

      if (!result.canceled && result.assets) {
        const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
        const oversized = result.assets.filter(
          (a) => a.fileSize != null && a.fileSize > MAX_FILE_SIZE_BYTES,
        );
        if (oversized.length > 0) {
          showToast('이미지 파일은 각 10MB 이하만 업로드할 수 있어요.', undefined, 'info');
          return;
        }
        const newImages = result.assets.map((asset) => asset.uri || '');
        const updatedImages = [...selectedImages, ...newImages].slice(0, 5);
        setSelectedImages(updatedImages);
      }
    } catch {
      showToast('이미지를 선택하지 못했어요.', undefined, 'error');
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  return (
    <SafeLayout style={styles.container}>
      <Box
        flexDir="row"
        justify="space-between"
        align="center"
        px="lg"
        py="sm"
        borderBottomWidth={1}
        borderColor="border.medium"
      >
        <Box width={40} />
        <Typography variant="h2" weight="bold" color="text.primary" flex={1} center>
          교환글 쓰기
        </Typography>
        <TouchableOpacity onPress={handleSubmit} disabled={isPending}>
          <Typography
            weight="bold"
            color="primary"
            style={isPending ? styles.submitButtonDisabled : undefined}
          >
            {isPending ? '등록 중...' : '등록'}
          </Typography>
        </TouchableOpacity>
      </Box>

      <KeyboardAwareScrollView
        style={styles.keyboardContainer}
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageScrollContent}
        >
          <Box flexDir="row" p="lg" gap="sm">
            {selectedImages.length < 5 ? (
              <TouchableOpacity style={styles.imageAddButton} onPress={handleImagePicker}>
                <Typography variant="h1" color="text.tertiary">
                  📷
                </Typography>
                <Typography variant="caption" color="text.tertiary">
                  {selectedImages.length}/5
                </Typography>
              </TouchableOpacity>
            ) : null}

            {selectedImages.map((imageUri, index) => (
              <Box key={index} style={styles.imageItemWrapper}>
                <Image source={{ uri: imageUri }} style={styles.imageThumbnail} />
                <TouchableOpacity style={styles.deleteButton} onPress={() => removeImage(index)}>
                  <Typography variant="caption" weight="bold" color="background">
                    ×
                  </Typography>
                </TouchableOpacity>
              </Box>
            ))}
          </Box>
        </ScrollView>

        <Box px="lg" py="md" borderBottomWidth={1} borderColor="border.medium">
          <Box flexDir="row" justify="space-between" align="center" mb="sm">
            <Typography variant="body1" weight="bold" color="text.primary">
              📍 위치 정보
            </Typography>
            <TouchableOpacity onPress={getCurrentLocation} disabled={locationLoading}>
              <Typography variant="caption" color="primary">
                {locationLoading ? '로딩 중...' : '🔄 새로고침'}
              </Typography>
            </TouchableOpacity>
          </Box>

          <Box flexDir="row" align="center" p="sm" bg="surface" rounded="md">
            <Typography variant="body1" mr="sm">
              📍
            </Typography>
            <Typography variant="body2" color="text.secondary" flex={1}>
              {currentLocation.address}
            </Typography>
            {locationLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : null}
          </Box>
        </Box>

        <Box px="lg">
          <Box py="md" borderBottomWidth={1} borderColor="border.medium">
            <Typography variant="body1" weight="bold" color="text.primary" mb="sm">
              카테고리
            </Typography>
            <Box flexDir="row" gap="sm">
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  formData.itemCategory === 'TICKET' && styles.categoryButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, itemCategory: 'TICKET' })}
              >
                <Typography
                  weight={formData.itemCategory === 'TICKET' ? 'bold' : 'medium'}
                  color={formData.itemCategory === 'TICKET' ? 'background' : 'text.secondary'}
                >
                  티켓
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  formData.itemCategory === 'GOODS' && styles.categoryButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, itemCategory: 'GOODS' })}
              >
                <Typography
                  weight={formData.itemCategory === 'GOODS' ? 'bold' : 'medium'}
                  color={formData.itemCategory === 'GOODS' ? 'background' : 'text.secondary'}
                >
                  굿즈
                </Typography>
              </TouchableOpacity>
            </Box>
          </Box>

          <TextInput
            placeholder="제목"
            style={[styles.titleInput, errors.title ? styles.inputError : null]}
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              if (text.trim()) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            placeholderTextColor={theme.colors.text.tertiary}
          />
          {errors.title && (
            <Typography variant="caption" color="error" style={styles.errorText} mb="md">
              {errors.title}
            </Typography>
          )}

          <TextInput
            placeholder="희망 아이템 (선택)"
            style={styles.desiredItemInput}
            value={formData.desiredItem}
            onChangeText={(text) => setFormData({ ...formData, desiredItem: text })}
            placeholderTextColor={theme.colors.text.tertiary}
          />

          <TextInput
            placeholder="내용을 입력하세요."
            multiline
            style={[styles.contentInput, errors.content ? styles.inputError : null]}
            value={formData.content}
            onChangeText={(text) => {
              setFormData({ ...formData, content: text });
              if (text.trim()) setErrors((prev) => ({ ...prev, content: '' }));
            }}
            placeholderTextColor={theme.colors.text.tertiary}
          />
          {errors.content ? (
            <Typography variant="caption" color="error" mt="xs" mb="md">
              {errors.content}
            </Typography>
          ) : null}
        </Box>
      </KeyboardAwareScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  imageScrollContent: {
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  imageItemWrapper: {
    position: 'relative',
  },
  imageAddButton: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  imageThumbnail: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: theme.spacing.md / 2 + 4, // 10
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  titleInput: {
    height: 60,
    fontSize: theme.typography.size.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
  },
  desiredItemInput: {
    height: 60,
    fontSize: theme.typography.size.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
  },
  contentInput: {
    minHeight: 200,
    fontSize: theme.typography.size.md,
    paddingTop: theme.spacing.lg,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
    color: theme.colors.text.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    marginTop: -8,
  },
});
