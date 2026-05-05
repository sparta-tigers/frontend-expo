import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { SafeLayout } from "@/components/ui/safe-layout";
import { createExchangeItem } from "@/src/features/exchange/api";
import { useCheckActiveItem } from "@/src/features/exchange/queries";
import { ItemCategory, LocationDto } from "@/src/features/exchange/types";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";

/**
 * 교환글 작성 화면 컴포넌트
 */
export default function CreateItemScreen() {
  const queryClient = useQueryClient();

  // 폼 데이터 상태
  const [formData, setFormData] = React.useState({
    title: "",
    desiredItem: "",
    content: "",
    itemCategory: "TICKET" as ItemCategory,
  });

  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);

  // 위치 정보 상태
  const [currentLocation, setCurrentLocation] = React.useState<LocationDto>({
    latitude: 37.5665,
    longitude: 126.978,
    address: "서울특별시",
  });
  const [locationLoading, setLocationLoading] = React.useState(false);

  // React Query Mutation으로 제출 처리
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      const requestFormData = new FormData();

      const requestData = {
        category: data.itemCategory,
        title: data.title.trim(),
        description: data.content.trim(),
        desiredItem: data.desiredItem?.trim() || "",
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address,
        },
      };

      requestFormData.append("itemRequest", JSON.stringify(requestData));

      selectedImages.forEach((uri, index) => {
        const filename = uri.split("/").pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        requestFormData.append("images", {
          uri: uri,
          name: filename,
          type,
        } as unknown as Blob);
      });

      return createExchangeItem(requestFormData);
    },
    onSuccess: () => {
      Alert.alert("성공", "아이템이 등록되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["items"] });
      router.replace("/(tabs)/exchange");
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      let errorMessage = "게시글 등록 중 문제가 발생했습니다.";
      const status = error?.response?.status;
      
      if (status === 409) {
        errorMessage = "이미 등록된 아이템이 있습니다. 하나의 계정당 하나의 아이템만 등록 가능합니다.";
        Logger.warn("아이템 중복 등록 시도 차단 (409)");
      } else {
        Logger.error(
          "아이템 생성 실패:",
          error instanceof Error ? error.message : String(error)
        );
      }

      Alert.alert("등록 실패", errorMessage);
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert("오류", "제목과 내용을 입력해주세요.");
      return;
    }
    mutate(formData);
  };

  // 위치 정보 가져오기
  const getCurrentLocation = async () => {
    setLocationLoading(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("권한 필요", "위치 정보를 사용하려면 권한이 필요합니다.");
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
          `${address?.city || ""} ${address?.district || ""}`.trim() ||
          "위치 정보 없음",
      };

      setCurrentLocation(locationData);
    } catch (error) {
      Logger.error("위치 정보 가져오기 실패:", error);
      Alert.alert("위치 정보 오류", "위치 정보를 가져올 수 없습니다. 기본 위치(서울)를 사용합니다.");
      const defaultLocation: LocationDto = {
        latitude: 37.5665,
        longitude: 126.978,
        address: "서울특별시",
      };
      setCurrentLocation(defaultLocation);
    } finally {
      setLocationLoading(false);
    }
  };

  const { data: hasActiveItem } = useCheckActiveItem();

  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  React.useEffect(() => {
    if (hasActiveItem === true) {
      Alert.alert(
        "접근 제한", 
        "이미 등록된 아이템이 있어 작성 페이지를 이용할 수 없습니다.",
        [{ text: "확인", onPress: () => router.back() }]
      );
    }
  }, [hasActiveItem]);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri || "");
        const updatedImages = [...selectedImages, ...newImages].slice(0, 5);
        setSelectedImages(updatedImages);
      }
    } catch {
      Alert.alert("오류", "이미지 선택에 실패했습니다.");
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  return (
    <SafeLayout edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButton} />
        <Text style={styles.headerTitle}>교환글 쓰기</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isPending}>
          <Text
            style={[
              styles.submitButton,
              isPending && styles.submitButtonDisabled,
            ]}
          >
            {isPending ? "등록 중..." : "등록"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={24}
        enableOnAndroid
        enableAutomaticScroll
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScrollContainer}
        >
          {selectedImages.length < 5 && (
            <TouchableOpacity
              style={styles.imageAddButton}
              onPress={handleImagePicker}
            >
              <Text style={styles.imageAddIcon}>📷</Text>
              <Text style={styles.imageCountText}>
                {selectedImages.length}/5
              </Text>
            </TouchableOpacity>
          )}

          {selectedImages.map((imageUri, index) => (
            <View key={index} style={styles.imageItemWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imageThumbnail} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>📍 위치 정보</Text>
            <TouchableOpacity
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              <Text style={styles.locationRefreshButton}>
                {locationLoading ? "로딩 중..." : "🔄 새로고침"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationContent}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{currentLocation.address}</Text>
            {locationLoading && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.locationLoading}
              />
            )}
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.categoryContainer}>
            <Text style={styles.label}>카테고리</Text>
            <View style={styles.categoryButtons}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  formData.itemCategory === "TICKET" &&
                    styles.categoryButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, itemCategory: "TICKET" })
                }
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    formData.itemCategory === "TICKET" &&
                      styles.categoryButtonTextActive,
                  ]}
                >
                  티켓
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  formData.itemCategory === "GOODS" &&
                    styles.categoryButtonActive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, itemCategory: "GOODS" })
                }
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    formData.itemCategory === "GOODS" &&
                      styles.categoryButtonTextActive,
                  ]}
                >
                  굿즈
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            placeholder="제목"
            style={styles.titleInput}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholderTextColor={theme.colors.text.tertiary}
          />

          <TextInput
            placeholder="희망 아이템 (선택)"
            style={styles.desiredItemInput}
            value={formData.desiredItem}
            onChangeText={(text) =>
              setFormData({ ...formData, desiredItem: text })
            }
            placeholderTextColor={theme.colors.text.tertiary}
          />

          <TextInput
            placeholder="내용을 입력하세요."
            multiline
            style={styles.contentInput}
            value={formData.content}
            onChangeText={(text) => setFormData({ ...formData, content: text })}
            placeholderTextColor={theme.colors.text.tertiary}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeLayout>
  );
}

// --- Styles — Co-location & Static Analysis Optimized ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  imageItemWrapper: {
    position: "relative",
  },
  imageAddIcon: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.text.tertiary,
  },
  imageCountText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  imageScrollContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  imageAddButton: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  imageThumbnail: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    marginRight: theme.spacing.sm,
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold,
  },
  formContainer: {
    paddingHorizontal: theme.spacing.lg,
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
    textAlignVertical: "top",
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
    color: theme.colors.text.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  headerTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    width: 40,
    height: 40,
  },
  submitButton: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
  },
  locationContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  locationTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  locationRefreshButton: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
  },
  locationIcon: {
    fontSize: theme.typography.size.lg,
    marginRight: theme.spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
  },
  locationLoading: {
    marginLeft: theme.spacing.sm,
  },
  categoryContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  label: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  categoryButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.background,
    alignItems: "center",
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weight.medium,
  },
  categoryButtonTextActive: {
    color: theme.colors.background,
    fontWeight: theme.typography.weight.bold,
  },
});
