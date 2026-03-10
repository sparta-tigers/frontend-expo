import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { itemsGetDetailAPI, itemsUpdateAPI } from "@/src/features/exchange/api";
import { ItemCategory } from "@/src/features/exchange/types";
import { theme } from "@/src/styles/theme";

// 정적 스타일 정의 (create.tsx 기반)
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
    marginRight: theme.spacing.sm,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: "cover",
  },
  // 이미지 첨부 UI (Read-only)
  imageScrollContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },
  imageScroll: {
    flexDirection: "row",
  },
  imageCountText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  readOnlyBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: theme.colors.text.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    opacity: 0.8,
  },
  readOnlyBadgeText: {
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: "bold",
  },
  // 입력 필드
  inputContainer: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },
  inputLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
  },
  textInputMultiline: {
    height: 120,
    textAlignVertical: "top",
  },
  // 선택 필드
  selectContainer: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.light,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  selectText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  selectPlaceholder: {
    color: theme.colors.text.tertiary,
  },
  // 하단 버튼
  bottomContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
});

/**
 * 교환글 수정 화면 컴포넌트
 *
 * 수정 정책:
 * 1. 이미지는 Read-only (수정 불가)
 * 2. 텍스트(제목, 설명, 희망 아이템)만 수정 가능
 * 3. 카테고리와 위치 정보 수정 가능
 * 4. PUT/PATCH 방식으로 JSON 데이터만 전송
 */
export default function EditExchangeItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [desiredItem, setDesiredItem] = useState("");
  const [category, setCategory] = useState<ItemCategory>("TICKET");
  const [location, setLocation] = useState("");

  // 아이템 상세 정보 조회
  const {
    data: item,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsGetDetailAPI(Number(id)),
    enabled: !!id,
  });

  // 데이터 로드 후 폼 초기화
  React.useEffect(() => {
    if (item?.data) {
      setTitle(item.data.title || "");
      setDescription(item.data.description || "");
      setDesiredItem(item.data.desiredItem || "");
      setCategory(item.data.category || "TICKET");
      setLocation(item.data.location?.address || "");
    }
  }, [item?.data]);

  // 수정 Mutation
  const { mutate: updateItem, isPending } = useMutation({
    mutationFn: (updateData: {
      category: ItemCategory;
      title: string;
      description: string;
    }) => itemsUpdateAPI(Number(id), updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      Alert.alert("성공", "교환글이 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      console.error("아이템 수정 실패:", error);
      Alert.alert("오류", "교환글 수정에 실패했습니다. 다시 시도해주세요.");
    },
  });

  // 제출 핸들러
  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("오류", "제목을 입력해주세요.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("오류", "설명을 입력해주세요.");
      return;
    }

    const updateData = {
      category,
      title: title.trim(),
      description: description.trim(),
      // 이미지는 수정 불가 - 제외
    };

    updateItem(updateData);
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = () => {
    Alert.alert("카테고리 선택", "카테고리를 선택해주세요.", [
      {
        text: "티켓",
        onPress: () => setCategory("TICKET"),
      },
      {
        text: "굿즈",
        onPress: () => setCategory("GOODS"),
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeLayout style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text.primary }}>
            불러오는 중...
          </Text>
        </View>
      </SafeLayout>
    );
  }

  // 에러 상태
  if (error || !item?.data) {
    return (
      <SafeLayout style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            아이템 정보를 불러올 수 없습니다.
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => router.back()}
          >
            <Text style={styles.submitButtonText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 섹션 (Read-only) */}
        <View style={styles.imageScrollContainer}>
          <Text style={styles.inputLabel}>첨부 이미지 (수정 불가)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            {item.data.images?.map((imageUrl: string, index: number) => (
              <View key={index} style={styles.imageItemWrapper}>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyBadgeText}>수정 불가</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.imageCountText}>
            {item.data.images?.length || 0}개의 이미지가 첨부되어 있습니다.
          </Text>
        </View>

        {/* 제목 입력 */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>제목 *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요"
            maxLength={50}
          />
        </View>

        {/* 설명 입력 */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>설명 *</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="교환할 아이템에 대한 설명을 입력해주세요"
            multiline
            maxLength={500}
          />
        </View>

        {/* 희망 아이템 입력 */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>희망 아이템</Text>
          <TextInput
            style={styles.textInput}
            value={desiredItem}
            onChangeText={setDesiredItem}
            placeholder="교환하고 싶은 아이템을 입력해주세요"
            maxLength={50}
          />
        </View>

        {/* 카테고리 선택 */}
        <View style={styles.selectContainer}>
          <Text style={styles.inputLabel}>카테고리</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleCategorySelect}
          >
            <Text
              style={[styles.selectText, !category && styles.selectPlaceholder]}
            >
              {category === "TICKET" ? "티켓" : "굿즈"}
            </Text>
            <Text style={styles.selectText}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* 위치 정보 입력 */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>거래 위치</Text>
          <TextInput
            style={styles.textInput}
            value={location}
            onChangeText={setLocation}
            placeholder="거래 가능한 위치를 입력해주세요"
            maxLength={100}
          />
        </View>
      </ScrollView>

      {/* 하단 제출 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          <Text style={styles.submitButtonText}>
            {isPending ? "수정 중..." : "수정 완료"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeLayout>
  );
}
