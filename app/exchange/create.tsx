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

// Location 모듈 타입 단언
const LocationModule = Location as any;

// 정적 스타일 정의 (작업 지시서 기준)
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
  // 이미지 첨부 UI
  imageScrollContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },
  imageAddButton: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.dark,
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
  // 입력 폼
  formContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  titleInput: {
    height: 60,
    fontSize: theme.typography.size.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing.lg,
  },
  desiredItemInput: {
    height: 60,
    fontSize: theme.typography.size.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing.lg,
  },
  contentInput: {
    minHeight: 200,
    fontSize: theme.typography.size.md,
    paddingTop: theme.spacing.lg,
    textAlignVertical: "top",
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },
  // 헤더
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
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
  },
  submitButton: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
  },
  // 위치 정보 UI
  locationContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
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
  // 카테고리 선택 UI
  categoryContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
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

/**
 * 교환글 작성 화면 컴포넌트
 *
 * 작업 지시서 Target 3 구현
 * - 이미지 첨부 UI: 가로 스크롤, 72x72 정방형
 * - 입력 폼: 하단 선 스타일
 * - SafeLayout 적용
 */
export default function CreateItemScreen() {
  const queryClient = useQueryClient();

  // 폼 데이터 상태
  const [formData, setFormData] = React.useState({
    title: "",
    desiredItem: "",
    content: "",
    itemCategory: "TICKET" as ItemCategory, // 기본값 추가
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

      // 1. JSON 데이터 구조를 백엔드 ItemCreateRequest DTO에 완벽히 매핑
      const requestData = {
        category: data.itemCategory, // 백엔드 ItemCategory Enum 매핑
        title: data.title.trim(),
        description: data.content.trim(),
        // 프론트엔드의 desiredItem 필드가 백엔드 DTO에 없다면 무시되지만 함께 전송
        desiredItem: data.desiredItem?.trim() || "",
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address,
        },
      };

      // 파트 이름을 "itemRequest"로 변경 (백엔드 @RequestPart("itemRequest") 대응)
      requestFormData.append("itemRequest", JSON.stringify(requestData));

      // 2. 파트 이름을 "images"로 변경 (백엔드 @RequestPart("images") 대응)
      selectedImages.forEach((uri, index) => {
        const filename = uri.split("/").pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        requestFormData.append("images", {
          // itemImage -> images 로 수정
          uri: uri,
          name: filename,
          type,
        } as any); // RN의 FormData 타입 에러 우회
      });

      Logger.debug("멀티파트 전송 준비 완료:", requestFormData);
      // 3. API 호출
      return createExchangeItem(requestFormData);
    },
    onSuccess: () => {
      Alert.alert("성공", "아이템이 등록되었습니다.");
      // 캐시 무효화로 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["items"] });
      router.replace("/(tabs)/exchange");
    },
    onError: (error: any) => {
      let errorMessage = "게시글 등록 중 문제가 발생했습니다.";
      const status = error?.response?.status;
      
      if (status === 409) {
        errorMessage = "이미 등록된 아이템이 있습니다. 하나의 계정당 하나의 아이템만 등록 가능합니다.";
        // 409 Conflict는 예상된 비즈니스 에러이므로 WARN으로 기록하여 콘솔 에러 노이즈 제거
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

  const onSubmit = (data: typeof formData) => {
    // 기본 유효성 검사
    if (!data.title.trim() || !data.content.trim()) {
      Alert.alert("오류", "제목과 내용을 입력해주세요.");
      return;
    }
    mutate(data);
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  // 위치 정보 가져오기
  const getCurrentLocation = async () => {
    setLocationLoading(true);

    try {
      // 위치 권한 요청
      let { status } = await LocationModule.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Logger.debug("위치 권한이 거부됨");
        Alert.alert("권한 필요", "위치 정보를 사용하려면 권한이 필요합니다.");
        setLocationLoading(false);
        return;
      }

      // 현재 위치 가져오기
      const location = await LocationModule.getCurrentPositionAsync({
        accuracy: LocationModule.Accuracy.Balanced,
      });

      // 주소 변환 (역지오코딩)
      const [address] = await LocationModule.reverseGeocodeAsync({
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

      Logger.debug("[위치 정보 가져오기]", locationData);
    } catch (error) {
      Logger.error(
        "위치 정보 가져오기 실패:",
        error instanceof Error ? error.message : String(error),
      );

      // 에러 메시지에 따라 처리
      if (
        error instanceof Error &&
        error.message.includes("location services are enabled")
      ) {
        Alert.alert(
          "위치 서비스 비활성화",
          "기기의 위치 서비스를 활성화해주세요.\n설정 > 개인정보 보호 및 보안 > 위치 서비스",
        );
      } else {
        Alert.alert(
          "위치 정보 오류",
          "위치 정보를 가져올 수 없습니다. 기본 위치(서울)를 사용합니다.",
        );
      }

      // 기본 위치 유지 (서울 시청)
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

  // 컴포넌트 마운트 시 위치 정보 및 활성 아이템 체크
  React.useEffect(() => {
    const init = async () => {
      await getCurrentLocation();
    };
    
    init();
  }, []);

  // 활성 아이템 감지 시 즉시 차단 (Redundant check)
  React.useEffect(() => {
    if (hasActiveItem === true) {
      Alert.alert(
        "접근 제한", 
        "이미 등록된 아이템이 있어 작성 페이지를 이용할 수 없습니다.",
        [{ text: "확인", onPress: () => router.back() }]
      );
    }
  }, [hasActiveItem]);

  // 이미지 선택
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
        const updatedImages = [...selectedImages, ...newImages].slice(0, 5); // 최대 5장
        setSelectedImages(updatedImages);
        Logger.debug("[이미지 선택]", `${updatedImages.length}장 선택됨`);
      }
    } catch {
      Alert.alert("오류", "이미지 선택에 실패했습니다.");
    }
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  return (
    <SafeLayout edges={["top", "bottom"]} style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
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

      {/* [KB-1] KeyboardAwareScrollView — TextInput 포커스 시 키보드가 내용을 가리지 않도록 자동 스크롤 */}
      <KeyboardAwareScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={24}
        enableOnAndroid
        enableAutomaticScroll
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 첨부 가로 스크롤 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScrollContainer}
        >
          {/* 이미지 추가 버튼 */}
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

          {/* 렌더링된 이미지 목록 */}
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

        {/* 위치 정보 영역 */}
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

        {/* 입력 폼 영역 */}
        <View style={styles.formContainer}>
          {/* 카테고리 선택 */}
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
          />

          <TextInput
            placeholder="희망 아이템 (선택)"
            style={styles.desiredItemInput}
            value={formData.desiredItem}
            onChangeText={(text) =>
              setFormData({ ...formData, desiredItem: text })
            }
          />

          <TextInput
            placeholder="내용을 입력하세요."
            multiline
            style={styles.contentInput}
            value={formData.content}
            onChangeText={(text) => setFormData({ ...formData, content: text })}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeLayout>
  );
}
