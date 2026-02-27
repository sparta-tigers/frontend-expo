import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SafeLayout } from "@/components/ui/safe-layout";
import { SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import { itemsGetDetailAPI } from "@/src/features/exchange/api";
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
  TouchableOpacity,
  View,
} from "react-native";

/**
 * 아이템 상세 페이지 컴포넌트
 *
 * PWA의 ItemDetailPage를 React Native로 구현
 * - 아이템 상세 정보 표시
 * - 교환 신청 기능
 */
export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // 아이템 상세 정보 가져오기
  const fetchItemDetail = useCallback(async () => {
    if (!id) return;

    try {
      const response = await itemsGetDetailAPI(Number(id));
      if (response.resultType === "SUCCESS" && response.data) {
        setItem(response.data);
      }
    } catch (error) {
      console.error("아이템 상세 로딩 실패:", error);
      Alert.alert("오류", "아이템 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 교환 신청
  const handleExchangeRequest = useCallback(async () => {
    if (!item || !user?.accessToken) {
      Alert.alert("오류", "로그인이 필요하거나 아이템 정보가 없습니다.");
      return;
    }

    // 내 아이템인지 확인
    if (item.userId === user.userId) {
      Alert.alert("알림", "내 아이템은 교환 신청할 수 없습니다.");
      return;
    }

    Alert.alert("교환 신청", `${item.title} 아이템을 교환하시겠습니까?`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "교환 신청",
        style: "default",
        onPress: async () => {
          setExchangeLoading(true);
          try {
            const request: CreateExchangeDto = {
              itemId: item.id,
              message: `${item.title} 아이템에 교환을 신청합니다.`,
            };

            const response = await exchangeCreateAPI(request);

            if (response.resultType === "SUCCESS") {
              Alert.alert(
                "교환 신청 완료",
                "교환 요청이 성공적으로 전송되었습니다. 상대방의 응답을 기다려주세요.",
                [
                  {
                    text: "확인",
                    onPress: () => router.back(),
                  },
                ],
              );
            } else {
              Alert.alert(
                "오류",
                "교환 신청에 실패했습니다. 다시 시도해주세요.",
              );
            }
          } catch (error) {
            console.error("교환 신청 실패:", error);
            Alert.alert(
              "오류",
              "네트워크 에러가 발생했습니다. 다시 시도해주세요.",
            );
          } finally {
            setExchangeLoading(false);
          }
        },
      },
    ]);
  }, [item, user, router]);

  // 채팅방으로 이동
  const handleChatRequest = () => {
    if (!item) return;

    // TODO: 채팅방 생성 API 연동
    Alert.alert("알림", "채팅 기능은 준비 중입니다.");
  };

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

        {/* 아이템 이미지 */}
        {item.imageUrl && (
          <Card style={styles.imageCard}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          </Card>
        )}

        {/* 아이템 정보 */}
        <Card style={styles.infoCard}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.title}
          </Text>

          <Text style={[styles.itemCategory, { color: colors.text }]}>
            카테고리: {item.category === "TICKET" ? "경기 티켓" : "굿즈/상품"}
          </Text>

          <Text
            style={[
              styles.itemStatus,
              {
                color:
                  item.status === "REGISTERED"
                    ? colors.primary
                    : item.status === "EXCHANGE_COMPLETED"
                      ? colors.success
                      : colors.destructive,
              },
            ]}
          >
            상태:{" "}
            {item.status === "REGISTERED"
              ? "등록됨"
              : item.status === "EXCHANGE_COMPLETED"
                ? "교환완료"
                : "교환실패"}
          </Text>

          <Text style={[styles.itemDescription, { color: colors.text }]}>
            {item.description}
          </Text>

          <Text style={[styles.itemDate, { color: colors.text }]}>
            등록일: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </Card>

        {/* 등록자 정보 */}
        <Card style={styles.sellerCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            등록자 정보
          </Text>
          <View style={styles.sellerInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.background }]}>
                {item.user?.nickname?.[0] || "U"}
              </Text>
            </View>
            <View style={styles.sellerDetails}>
              <Text style={[styles.sellerName, { color: colors.text }]}>
                {item.user?.nickname || "알 수 없음"}
              </Text>
              <Text style={[styles.sellerEmail, { color: colors.muted }]}>
                사용자 ID: {item.user?.id || "정보 없음"}
              </Text>
            </View>
          </View>
        </Card>

        {/* 액션 버튼 */}
        <View style={styles.actionContainer}>
          <Button
            variant="primary"
            onPress={handleExchangeRequest}
            loading={exchangeLoading}
            style={styles.exchangeButton}
            fullWidth
          >
            교환 신청
          </Button>

          <Button
            variant="outline"
            onPress={handleChatRequest}
            style={styles.chatButton}
            fullWidth
          >
            채팅하기
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
  },
  itemImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  infoCard: {
    marginBottom: SPACING.SCREEN,
    padding: SPACING.SCREEN,
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: SPACING.SMALL,
  },
  itemCategory: {
    fontSize: 16,
    marginBottom: SPACING.SMALL,
  },
  itemStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: SPACING.COMPONENT,
  },
  itemDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.COMPONENT,
  },
  itemDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  sellerCard: {
    marginBottom: SPACING.SCREEN,
    padding: SPACING.SCREEN,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: SPACING.COMPONENT,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.COMPONENT,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  sellerEmail: {
    fontSize: 14,
  },
  actionContainer: {
    padding: SPACING.SCREEN,
    gap: SPACING.COMPONENT,
  },
  exchangeButton: {
    marginBottom: SPACING.SMALL,
  },
  chatButton: {},
});
