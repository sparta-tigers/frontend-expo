import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import { itemsGetDetailAPI, itemsUpdateAPI } from "@/src/features/exchange/api";
import { UpdateItemRequest } from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";
import { getImageUrl } from "@/src/utils/url";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

/**
 * 아이템 수정 페이지 컴포넌트
 *
 * 기존 아이템 정보를 불러와 수정하는 기능
 * - 아이템 정보 수정
 */
export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();

  // React Query로 아이템 상세 정보 가져오기
  const {
    data: itemResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsGetDetailAPI(Number(id)),
    enabled: !!id,
  });

  const item = itemResponse?.data;

  // 폼 상태 - defaultValues 주입
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [category, setCategory] = useState<"TICKET" | "GOODS">(
    item?.category || "GOODS",
  );

  // 아이템 데이터가 로드된 후 폼 초기화
  React.useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setCategory(item.category);
    }
  }, [item]);

  // 아이템 수정 Mutation
  const updateItemMutation = useMutation({
    mutationFn: (request: UpdateItemRequest) =>
      itemsUpdateAPI(Number(id), request),
    onSuccess: () => {
      Alert.alert("수정 완료", "아이템이 성공적으로 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Logger.error("아이템 수정 실패:", error);
      Alert.alert("오류", "아이템 수정에 실패했습니다.");
    },
  });

  // 아이템 수정 핸들러
  const handleUpdateItem = useCallback(() => {
    if (!item || !user?.accessToken) {
      Alert.alert("오류", "로그인이 필요하거나 아이템 정보가 없습니다.");
      return;
    }

    // 본인 아이템인지 확인 - 강화된 권한 검증
    if (!user?.userId || !item?.userId) {
      Alert.alert("오류", "사용자 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    if (item.userId !== user.userId) {
      Alert.alert("오류", "본인의 아이템만 수정할 수 있습니다.");
      Logger.debug("[권한 오류] 아이템 소유자 불일치:", {
        itemUserId: item.userId,
        currentUserId: user.userId,
        itemUserNickname: item.user?.userNickname,
        currentUserEmail: user?.email,
      });
      return;
    }

    // 유효성 검사
    if (!title.trim()) {
      Alert.alert("오류", "제목을 입력해주세요.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("오류", "설명을 입력해주세요.");
      return;
    }

    Alert.alert("아이템 수정", "이 아이템을 수정하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "수정",
        style: "default",
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
  }, [item, user, title, description, category, updateItemMutation]);

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeLayout edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.text, marginTop: SPACING.SMALL },
            ]}
          >
            아이템 정보를 불러오는 중...
          </Text>
        </View>
      </SafeLayout>
    );
  }

  // 에러 상태
  if (error || !item) {
    return (
      <SafeLayout edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            아이템 정보를 불러올 수 없습니다.
          </Text>
          <Button onPress={() => router.reload()}>다시 시도</Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        style={styles.container}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >


        {/* 아이템 이미지 */}
        {item.imageUrl && (
          <Card style={styles.imageCard}>
            <Image
              source={{ uri: getImageUrl(item.imageUrl) }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          </Card>
        )}

        {/* 수정 폼 */}
        <Card style={styles.formCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            아이템 정보 수정
          </Text>

          {/* 제목 입력 */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>제목</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="아이템 제목을 입력하세요"
              placeholderTextColor={colors.muted}
              multiline
            />
          </View>

          {/* 카테고리 선택 */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>카테고리</Text>
            <View style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      category === "TICKET" ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setCategory("TICKET")}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color:
                        category === "TICKET" ? colors.background : colors.text,
                    },
                  ]}
                >
                  경기 티켓
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      category === "GOODS" ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setCategory("GOODS")}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color:
                        category === "GOODS" ? colors.background : colors.text,
                    },
                  ]}
                >
                  굿즈/상품
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 설명 입력 */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>설명</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="아이템 상세 설명을 입력하세요"
              placeholderTextColor={colors.muted}
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
      </KeyboardAwareScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.SMALL,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.SCREEN,
  },
  errorText: {
    fontSize: 16,
    marginBottom: SPACING.SCREEN,
    textAlign: "center",
  },

  imageCard: {
    marginBottom: SPACING.SCREEN,
    marginHorizontal: SPACING.SCREEN,
  },
  itemImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  formCard: {
    margin: SPACING.SCREEN,
    padding: SPACING.SCREEN,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: SPACING.COMPONENT,
  },
  inputContainer: {
    marginBottom: SPACING.COMPONENT,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: SPACING.SMALL,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.SMALL,
    fontSize: 16,
  },
  textArea: {
    height: 120,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: SPACING.SMALL,
  },
  categoryButton: {
    flex: 1,
    padding: SPACING.SMALL,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionContainer: {
    padding: SPACING.SCREEN,
    paddingTop: 0,
  },
  saveButton: {
    marginBottom: SPACING.SMALL,
  },
});
