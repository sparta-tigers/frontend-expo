import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeLayout } from "@/components/ui/safe-layout";
import { createExchangeItem } from "@/src/features/exchange/api";
import { ItemCategory, LocationDto } from "@/src/features/exchange/types";
import { theme } from "@/src/styles/theme";

// 정적 스타일 정의 (작업 지시서 기준)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  },
  submitButton: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
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
  });

  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);

  // React Query Mutation으로 제출 처리
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: typeof formData) => {
      // 백엔드 CreateItemRequest 스펙에 맞게 페이로드 재구성
      const payload = {
        itemCategory: "TICKET" as ItemCategory, // 기본값
        title: data.title,
        description: data.content,
        location: {
          latitude: 37.5665,
          longitude: 126.978,
          address: "서울시",
        } as LocationDto,
        desiredItem: data.desiredItem || undefined,
      };

      return createExchangeItem(payload as any, selectedImages);
    },
    onSuccess: () => {
      Alert.alert("성공", "아이템이 등록되었습니다.");
      // 캐시 무효화로 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["items"] });
      router.replace("/(tabs)/exchange");
    },
    onError: (error) => {
      Alert.alert("업로드 실패", "게시글 등록 중 문제가 발생했습니다.");
      console.error(error);
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
    <SafeLayout
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>교환글 쓰기</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isPending}>
          <Text style={[styles.submitButton, isPending && { opacity: 0.6 }]}>
            {isPending ? "등록 중..." : "등록"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
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
              <Text
                style={{
                  fontSize: theme.typography.size.xl,
                  color: theme.colors.text.tertiary,
                }}
              >
                📷
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.size.xs,
                  color: theme.colors.text.tertiary,
                  marginTop: theme.spacing.xs,
                }}
              >
                {selectedImages.length}/5
              </Text>
            </TouchableOpacity>
          )}

          {/* 렌더링된 이미지 목록 */}
          {selectedImages.map((imageUri, index) => (
            <View key={index} style={{ position: "relative" }}>
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

        {/* 입력 폼 영역 */}
        <View style={styles.formContainer}>
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
      </ScrollView>
    </SafeLayout>
  );
}
