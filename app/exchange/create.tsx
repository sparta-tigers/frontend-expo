import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemCategory, ItemDto, LocationDto } from "@/src/api/types/items";
import { useAsyncState } from "@/src/hooks/useAsyncState";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
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
    region: "", // 거래 희망 장소 (동/면/읍)
    latitude: 37.5665, // 위도 (기본값: 서울)
    longitude: 126.978, // 경도 (기본값: 서울)
  });

  // 위치 가져오기 로딩 상태
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 입력값 변경 핸들러
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (category: ItemCategory) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  // 이미지 선택 핸들러
  const handleImageSelect = async () => {
    try {
      // 권한 요청
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFormData((prev) => ({ ...prev, imageUrl: result.assets[0].uri }));
      }
    } catch (error) {
      console.error("이미지 선택 에러:", error);
      Alert.alert("오류", "이미지 선택에 실패했습니다.");
    }
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  // 현재 위치 가져오기 핸들러
  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      // 1. 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "위치 접근 권한이 필요합니다.");
        return;
      }

      // 2. 현재 위치 가져오기
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 3. 좌표를 주소로 변환
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];

        // 4. 동네 이름 추출 (우선순위: street > district > subdistrict > city)
        let regionName = "";

        if (address.street) {
          regionName = address.street;
        } else if (address.district) {
          regionName = address.district;
        } else if (address.subdistrict) {
          regionName = address.subdistrict;
        } else if (address.city) {
          regionName = address.city;
        } else {
          regionName = "알 수 없는 위치";
        }

        // 5. 폼 데이터 업데이트
        setFormData((prev) => ({
          ...prev,
          region: regionName,
          latitude,
          longitude,
        }));

        Alert.alert("위치 확인", `${regionName}으로 설정되었습니다.`);
      } else {
        Alert.alert("오류", "주소를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("위치 가져오기 에러:", error);
      Alert.alert("오류", "위치를 가져오는데 실패했습니다.");
    } finally {
      setIsGettingLocation(false);
    }
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
        latitude: formData.latitude, // 실제 위치 데이터 사용
        longitude: formData.longitude, // 실제 위치 데이터 사용
      };

      // FormData 생성
      const requestFormData = new FormData();
      requestFormData.append("item", JSON.stringify(itemDto));
      requestFormData.append("location", JSON.stringify(locationDto));

      // 이미지가 있으면 추가
      if (formData.imageUrl) {
        const filename = formData.imageUrl.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;

        // React Native FormData 스펙 준수
        requestFormData.append("itemImage", {
          uri: formData.imageUrl,
          name: filename || "image.jpg",
          type,
        } as any);
      }

      // API 호출 (임시로 console.log로 확인)
      console.log("FormData 전송:", {
        item: JSON.stringify(itemDto),
        location: JSON.stringify(locationDto),
        image: formData.imageUrl ? "이미지 파일 포함됨" : "이미지 없음",
      });

      // 실제 API 호출 (주석 처리 - 백엔드 준비 시 해제)
      // await createItem(itemsCreateAPI(requestFormData as any));

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
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            이미지
          </Text>
          <TouchableOpacity
            style={[
              styles.imageUploadContainer,
              { borderColor: theme.colors.outline },
            ]}
            onPress={handleImageSelect}
          >
            {formData.imageUrl ? (
              <View style={styles.uploadedImageContainer}>
                <Image
                  source={{ uri: formData.imageUrl }}
                  style={styles.uploadedImage}
                />
                <TouchableOpacity
                  style={[
                    styles.imageRemoveButton,
                    { backgroundColor: theme.colors.error },
                  ]}
                  onPress={handleImageRemove}
                >
                  <Text
                    style={[
                      styles.imageRemoveButtonText,
                      { color: theme.colors.onError },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
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
                <Text
                  style={[
                    styles.imagePlaceholderSubText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  갤러리에서 선택
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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

        {/* 거래 희망 장소 */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            거래 희망 장소
          </Text>
          <View style={styles.locationContainer}>
            <Input
              value={formData.region}
              onChangeText={(value) => handleInputChange("region", value)}
              placeholder="동네 이름을 입력하세요"
              style={[styles.input, styles.locationInput]}
            />
            <Button
              onPress={handleGetCurrentLocation}
              loading={isGettingLocation}
              disabled={isGettingLocation}
              variant="outline"
              size="sm"
              style={styles.locationButton}
            >
              📍 현재 위치로 찾기
            </Button>
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  imageUploadContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadedImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  imageRemoveButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  imagePlaceholderSubText: {
    fontSize: 14,
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
  locationContainer: {
    gap: 12,
  },
  locationInput: {
    marginBottom: 0,
  },
  locationButton: {
    alignSelf: "flex-start",
  },
  buttonContainer: {
    marginTop: 32,
  },
  submitButton: {
    marginBottom: 16,
  },
});
