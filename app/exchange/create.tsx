import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemsCreateAPI } from "@/src/api/items";
import {
    CreateItemRequest,
    ItemCategory,
    ItemDto,
    LocationDto,
} from "@/src/api/types/items";
import { useAsyncState } from "@/src/hooks/useAsyncState";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "react-native-paper";

/**
 * 아이템 생성 화면
 * 사용자가 새로운 물물교환 아이템을 등록하는 컴포넌트
 */
export default function CreateItemScreen() {
  const router = useRouter();
  const theme = useTheme();

  // useAsyncState 훅으로 생성 요청 상태 관리
  const [createState, createItem] = useAsyncState<any>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    category: "TICKET" as ItemCategory,
    title: "",
    description: "",
    price: "",
    imageUrl: "", // 일단 문자열로 관리 (추후 expo-image-picker 연동)
  });

  // 입력값 변경 핸들러
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (category: ItemCategory) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  // 이미지 선택 핸들러 (임시)
  const handleImageSelect = () => {
    Alert.alert("이미지 업로드", "이미지 업로드 기능은 추후 구현됩니다.", [
      { text: "확인" },
    ]);
  };

  // 입력값 검증
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert("오류", "제목을 입력해주세요.");
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert("오류", "설명을 입력해주세요.");
      return false;
    }

    if (!formData.price.trim()) {
      Alert.alert("오류", "가격/가치를 입력해주세요.");
      return false;
    }

    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      Alert.alert("오류", "올바른 가격을 입력해주세요.");
      return false;
    }

    return true;
  };

  // 아이템 생성 핸들러
  const handleCreateItem = async () => {
    if (!validateForm()) return;

    try {
      const itemDto: ItemDto = {
        category: formData.category,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      const locationDto: LocationDto = {
        latitude: 37.5665, // 일단 서울 좌표로 고정 (추후 expo-location 연동)
        longitude: 126.978,
      };

      const request: CreateItemRequest = {
        itemDto,
        locationDto,
      };

      await createItem(itemsCreateAPI(request));

      Alert.alert("성공", "아이템이 성공적으로 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("아이템 생성 에러:", error);
      Alert.alert("오류", "아이템 등록에 실패했습니다.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 헤더 */}
      <View
        style={[styles.header, { borderBottomColor: theme.colors.outline }]}
      >
        <Button onPress={() => router.back()} variant="ghost" size="sm">
          ←
        </Button>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          아이템 등록
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 폼 내용 */}
      <View style={styles.formContainer}>
        {/* 이미지 업로드 */}
        <TouchableOpacity
          style={[
            styles.imageUploadContainer,
            { borderColor: theme.colors.outline },
          ]}
          onPress={handleImageSelect}
        >
          {formData.imageUrl ? (
            <Image
              source={{ uri: formData.imageUrl }}
              style={styles.uploadedImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text
                style={[
                  styles.imagePlaceholderText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                📷 이미지 추가
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 카테고리 선택 */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            카테고리
          </Text>
          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                formData.category === "TICKET" && [
                  styles.categoryButtonActive,
                  { backgroundColor: theme.colors.primary },
                ],
              ]}
              onPress={() => handleCategoryChange("TICKET")}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  formData.category === "TICKET"
                    ? { color: theme.colors.onPrimary }
                    : { color: theme.colors.onSurfaceVariant },
                ]}
              >
                티켓
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                formData.category === "GOODS" && [
                  styles.categoryButtonActive,
                  { backgroundColor: theme.colors.primary },
                ],
              ]}
              onPress={() => handleCategoryChange("GOODS")}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  formData.category === "GOODS"
                    ? { color: theme.colors.onPrimary }
                    : { color: theme.colors.onSurfaceVariant },
                ]}
              >
                굿즈
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 제목 */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            제목 *
          </Text>
          <Input
            value={formData.title}
            onChangeText={(value) => handleInputChange("title", value)}
            placeholder="아이템 제목을 입력하세요"
            style={styles.input}
          />
        </View>

        {/* 설명 */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            설명 *
          </Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                color: theme.colors.onSurface,
              },
            ]}
            value={formData.description}
            onChangeText={(value) => handleInputChange("description", value)}
            placeholder="아이템 상세 설명을 입력하세요"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 가격/가치 */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            가격/가치 *
          </Text>
          <Input
            value={formData.price}
            onChangeText={(value) => handleInputChange("price", value)}
            placeholder="가격을 입력하세요"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* 등록 버튼 */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleCreateItem}
            loading={createState.status === "loading"}
            disabled={createState.status === "loading"}
            fullWidth
            style={styles.submitButton}
          >
            아이템 등록
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerSpacer: {
    width: 60,
  },
  formContainer: {
    padding: 20,
  },
  imageUploadContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  categoryButtonActive: {
    borderWidth: 0,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  buttonContainer: {
    marginTop: 32,
  },
  submitButton: {
    marginBottom: 16,
  },
});
