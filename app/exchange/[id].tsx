import { Button } from "@/components/ui/button";
import { itemsGetDetailAPI } from "@/src/api/items";
import { Item } from "@/src/api/types/items";
import { useAsyncState } from "@/src/hooks/useAsyncState";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

/**
 * 아이템 상세 화면
 * 특정 아이템의 상세 정보를 표시
 */
export default function ItemDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id || "0");

  // useAsyncState 훅으로 상세 정보 상태 관리
  const [detailState, fetchDetail] = useAsyncState<Item | null>(null);

  // 아이템 상세 정보 조회
  const loadItemDetail = useCallback(async () => {
    try {
      const response = await itemsGetDetailAPI(itemId);
      return response.data;
    } catch (error) {
      console.error("아이템 상세 로딩 실패:", error);
      throw error;
    }
  }, [itemId]);

  // 컴포넌트 마운트 시 아이템 상세 정보 조회
  useEffect(() => {
    if (itemId > 0) {
      fetchDetail(loadItemDetail());
    }
  }, [itemId, fetchDetail, loadItemDetail]);

  // 상태 변화에 따른 처리
  useEffect(() => {
    if (detailState.status === "error" && detailState.error) {
      Alert.alert("오류", "아이템 정보를 불러오는데 실패했습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);
    }
  }, [detailState.status, detailState.error, router]);

  // 로딩 상태
  if (detailState.status === "loading") {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          아이템 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  // 에러 상태
  if (detailState.status === "error" || !detailState.data) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          아이템 정보를 불러올 수 없습니다.
        </Text>
        <Button onPress={() => router.back()} variant="outline">
          뒤로 가기
        </Button>
      </View>
    );
  }

  const item = detailState.data;

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
          아이템 상세
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 이미지 */}
      {item.image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
        </View>
      )}

      {/* 기본 정보 */}
      <View style={styles.section}>
        <Text style={[styles.category, { color: theme.colors.primary }]}>
          {item.category === "TICKET" ? "티켓" : "굿즈"}
        </Text>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {item.description}
        </Text>
      </View>

      {/* 등록자 정보 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          등록자 정보
        </Text>
        <Text
          style={[styles.userInfo, { color: theme.colors.onSurfaceVariant }]}
        >
          {item.user.userNickname || `사용자 ${item.user.userId}`}
        </Text>
      </View>

      {/* 상태 정보 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          교환 상태
        </Text>
        <Text
          style={[
            styles.status,
            {
              color:
                item.status === "REGISTERED"
                  ? theme.colors.primary
                  : item.status === "COMPLETED"
                    ? theme.colors.tertiary
                    : theme.colors.error,
            },
          ]}
        >
          {item.status === "REGISTERED"
            ? "등록됨"
            : item.status === "COMPLETED"
              ? "교환 완료"
              : "교환 실패"}
        </Text>
      </View>

      {/* 위치 정보 */}
      {item.location && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            위치 정보
          </Text>
          <Text
            style={[
              styles.locationInfo,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            위도: {item.location.latitude.toFixed(6)}
            {"\n"}
            경도: {item.location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* 교환 요청 버튼 */}
      {item.status === "REGISTERED" && (
        <View style={styles.buttonContainer}>
          <Button fullWidth style={styles.exchangeButton}>
            교환 요청하기
          </Button>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
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
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  category: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
  },
  status: {
    fontSize: 16,
    fontWeight: "500",
  },
  locationInfo: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
  },
  exchangeButton: {
    marginBottom: 16,
  },
});
