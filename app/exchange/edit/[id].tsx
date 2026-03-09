import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SafeLayout } from "@/components/ui/safe-layout";
import { SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import { itemsGetDetailAPI, itemsUpdateAPI } from "@/src/features/exchange/api";
import { Item, UpdateItemRequest } from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

/**
 * 아이템 수정 페이지 컴포넌트
 *
 * 기존 아이템 정보를 불러와 수정하는 기능
 * - 아이템 정보 수정
 * - 이미지 업로드 (TODO)
 * - 위치 정보 수정 (TODO)
 */
export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"TICKET" | "GOODS">("GOODS");

  // 아이템 상세 정보 가져오기
  const fetchItemDetail = useCallback(async () => {
    if (!id) return;

    try {
      const response = await itemsGetDetailAPI(Number(id));
      if (response.resultType === "SUCCESS" && response.data) {
        const itemData = response.data;
        setItem(itemData);

        // 폼 초기화
        setTitle(itemData.title);
        setDescription(itemData.description);
        setCategory(itemData.category);
      }
    } catch (error) {
      console.error("아이템 상세 로딩 실패:", error);
      Alert.alert("오류", "아이템 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 아이템 수정
  const handleUpdateItem = useCallback(async () => {
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
      console.log("🚨 [권한 오류] 아이템 소유자 불일치:", {
        itemUserId: item.userId,
        currentUserId: user.userId,
        itemUserNickname: item.user?.nickname,
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
        onPress: async () => {
          setSaving(true);
          try {
            const request: UpdateItemRequest = {
              category: category, // 백엔드 UpdateItemRequestDto 스펙에 맞는 필드명
              title: title.trim(),
              description: description.trim(),
            };

            const response = await itemsUpdateAPI(item.id, request);

            if (response.resultType === "SUCCESS") {
              Alert.alert("수정 완료", "아이템이 성공적으로 수정되었습니다.", [
                {
                  text: "확인",
                  onPress: () => router.back(),
                },
              ]);
            } else {
              Alert.alert("오류", "아이템 수정에 실패했습니다.");
            }
          } catch (error) {
            console.error("아이템 수정 실패:", error);
            Alert.alert("오류", "네트워크 에러가 발생했습니다.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }, [item, user, title, description, category, router]);

  // 화면 포커스 시 데이터 로드
  React.useEffect(() => {
    fetchItemDetail();
  }, [fetchItemDetail]);

  // 로딩 상태
  if (loading) {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            아이템 정보를 불러오는 중...
          </Text>
        </View>
      </SafeLayout>
    );
  }

  // 아이템 정보가 없는 경우
  if (!item) {
    return (
      <SafeLayout style={{ backgroundColor: colors.background }}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            아이템 정보를 찾을 수 없습니다.
          </Text>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            돌아가기
          </Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={{ backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.primary }]}>
              ← 돌아가기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 아이템 이미지 (TODO: 이미지 업로드 기능) */}
        {item.imageUrl && (
          <Card style={styles.imageCard}>
            <Image
              source={{ uri: item.imageUrl }}
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
            loading={saving}
            style={styles.saveButton}
            fullWidth
          >
            아이템 수정
          </Button>
        </View>
      </ScrollView>
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
  backButton: {
    marginTop: SPACING.SMALL,
  },
  header: {
    padding: SPACING.SCREEN,
    paddingBottom: SPACING.SMALL,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
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
