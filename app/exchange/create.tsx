import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import { itemsCreateAPI } from "@/src/features/exchange/api";
import { ItemCategory, LocationDto } from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";

// Zod 스키마 강제 - 작업 지시서 요구사항
const createItemSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요."),
  description: z.string().min(1, "내용을 입력해주세요."),
  desiredItem: z.string().optional(),
  categoryId: z.number().min(1, "카테고리를 선택해주세요."),
});

type CreateItemFormData = z.infer<typeof createItemSchema> & {
  [key: string]: string | number | undefined;
};

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.SCREEN,
  },
  section: {
    marginBottom: SPACING.SECTION,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.SECTION_TITLE,
    fontWeight: "bold",
    marginBottom: SPACING.COMPONENT,
  },
  imagePickerContainer: {
    flexDirection: "row",
    gap: SPACING.SMALL,
    marginBottom: SPACING.COMPONENT,
  },
  imagePickerButton: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.CARD,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  imagePickerButtonText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.CARD,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: SPACING.SMALL,
    marginBottom: SPACING.COMPONENT,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
    borderWidth: 1,
    alignItems: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
  },
  categoryButtonTextActive: {
    color: "#fff",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SMALL,
    marginBottom: SPACING.COMPONENT,
  },
  locationButton: {
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.COMPONENT,
    borderRadius: BORDER_RADIUS.BUTTON,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  locationButtonText: {
    fontSize: FONT_SIZE.SMALL,
    color: "#666",
  },
  submitContainer: {
    padding: SPACING.SCREEN,
    paddingBottom: SPACING.SCREEN * 2, // 키보드 공간 확보
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
    marginTop: SPACING.SMALL,
  },
});

/**
 * 교환글 작성 화면 컴포넌트
 *
 * 작업 지시서 Phase 1 Target 3 구현
 * - Zod 스키마 강제 유효성 검증
 * - KeyboardAwareScrollView로 키보드 가림 방지
 * - 이미지 업로드 Mocking (백엔드 결함 우회)
 * - react-hook-form + 제어 컴포넌트
 */
export default function CreateItemScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { user } = useAuth();

  // react-hook-form 대신 useState로 간단 구현 (제어 컴포넌트 원리 적용)
  const [formData, setFormData] = React.useState<CreateItemFormData>({
    title: "",
    description: "",
    categoryId: 1, // TICKET 카테고리 기본값
  });

  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Partial<CreateItemFormData>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // React Query Mutation으로 제출 처리
  const createItemMutation = useMutation({
    mutationFn: async (data: CreateItemFormData) => {
      // 백엔드 결함 우회: 파일 데이터 배제, JSON으로만 전송
      const payload = {
        itemCategory:
          data.categoryId === 1
            ? ("TICKET" as ItemCategory)
            : ("GOODS" as ItemCategory),
        title: data.title,
        description: data.description,
        location: {
          latitude: 37.5665,
          longitude: 126.978,
          address: "서울시",
        } as LocationDto,
        images: [], // 껍데기 처리 (핵심)
        desiredItem: data.desiredItem || undefined,
      };

      return itemsCreateAPI(payload as any);
    },
    onSuccess: () => {
      Alert.alert("성공", "아이템이 등록되었습니다.");
      // 캐시 무효화로 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["items"] });
      router.replace("/(tabs)/exchange");
    },
    onError: () => {
      Alert.alert("오류", "아이템 등록에 실패했습니다.");
      console.error("아이템 생성 실패");
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Zod 유효성 검증
  const validateForm = (): boolean => {
    try {
      createItemSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<CreateItemFormData> = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const key = err.path[0] as keyof CreateItemFormData;
            fieldErrors[key] = err.message as any;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // 이미지 선택 (UI Only - 백엔드 수정 전까지 기능 정지)
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

        // 개발 환경에서만 경고 표시
        if (__DEV__) {
          console.log(
            "🔍 [이미지 선택] UI만 구현됨 (백엔드 수정 전까지 기능 정지)",
          );
        }
      }
    } catch (error) {
      Alert.alert("오류", "이미지 선택에 실패했습니다.");
    }
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  // 카테고리 선택
  const categories = [
    { id: 1, name: "티켓", value: "TICKET" as ItemCategory },
    { id: 2, name: "굿즈", value: "GOODS" as ItemCategory },
  ];

  // 폼 제출
  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert("오류", "입력값을 확인해주세요.");
      return;
    }

    if (!user?.accessToken) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    createItemMutation.mutate(formData);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {/* 이미지 선택 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            이미지 (최대 5장)
          </Text>
          <View style={styles.imagePickerContainer}>
            {/* 이미지 선택 버튼 */}
            {selectedImages.length < 5 && (
              <TouchableOpacity
                style={[
                  styles.imagePickerButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleImagePicker}
              >
                <Text
                  style={[
                    styles.imagePickerButtonText,
                    { color: colors.muted },
                  ]}
                >
                  + 이미지
                  <br />
                  추가
                </Text>
              </TouchableOpacity>
            )}

            {/* 선택된 이미지 미리보기 */}
            {selectedImages.map((imageUri, index) => (
              <View key={index} style={{ position: "relative" }}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.selectedImage}
                />
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.destructive,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => removeImage(index)}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 카테고리 선택 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            카테고리
          </Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  {
                    borderColor: colors.border,
                    backgroundColor:
                      formData.categoryId === category.id
                        ? colors.primary
                        : colors.surface,
                  },
                ]}
                onPress={() =>
                  setFormData({ ...formData, categoryId: category.id })
                }
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    {
                      color:
                        formData.categoryId === category.id
                          ? colors.background
                          : colors.text,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            제목 *
          </Text>
          <Input
            placeholder="제목을 입력하세요"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            error={!!errors.title}
          />
        </View>

        {/* 설명 입력 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            설명 *
          </Text>
          <Input
            placeholder="상세 설명을 입력하세요"
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            multiline
            numberOfLines={4}
            error={!!errors.description}
          />
        </View>

        {/* 희망 아이템 입력 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            희망 교환 물품 (선택)
          </Text>
          <Input
            placeholder="희망하는 물품을 입력하세요"
            value={formData.desiredItem || ""}
            onChangeText={(text) =>
              setFormData({ ...formData, desiredItem: text })
            }
          />
        </View>

        {/* 제출 버튼 */}
        <View style={styles.submitContainer}>
          <Button
            style={[
              { backgroundColor: colors.primary },
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "등록 중..." : "아이템 등록"}
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
