import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { FONT_SIZE, SPACING } from "@/constants/layout";
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
    <SafeLayout style={{ backgroundColor: theme.colors.surface }}>
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
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {item.description}
          </Text>
        </View>

        {/* 등록자 정보 */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
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
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
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
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.SCREEN * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.COMPONENT,
    fontSize: FONT_SIZE.BODY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: FONT_SIZE.BODY,
    marginBottom: SPACING.COMPONENT,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.COMPONENT,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.CARD_TITLE,
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
    padding: SPACING.SCREEN,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  category: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  title: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
    marginBottom: SPACING.COMPONENT,
  },
  description: {
    fontSize: FONT_SIZE.BODY,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  userInfo: {
    fontSize: FONT_SIZE.BODY,
  },
  status: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "500",
  },
  locationInfo: {
    fontSize: FONT_SIZE.SMALL,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: SPACING.SCREEN,
  },
  exchangeButton: {
    marginBottom: SPACING.COMPONENT,
  },
});
