import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { itemsGetDetailAPI } from "@/src/api/items";
import { Item } from "@/src/api/types/items";
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

// 기본 색상 팔레트
const colors = {
  light: {
    primary: "#3B82F6",
    background: "#FFFFFF",
    card: "#F9FAFB",
    text: "#111827",
    border: "#E5E7EB",
    muted: "#6B7280",
    accent: "#10B981",
    destructive: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    success: "#10B981",
  },
  dark: {
    primary: "#2563EB",
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    border: "#374151",
    muted: "#9CA3AF",
    accent: "#059669",
    destructive: "#DC2626",
    warning: "#D97706",
    info: "#2563EB",
    success: "#059669",
  },
} as const;

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
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchangeLoading] = useState(false);

  // 테마 색상
  const textColor = colors.light.text;
  const primaryColor = colors.light.primary;

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
  const handleExchangeRequest = () => {
    if (!item) return;

    Alert.alert("교환 신청", `${item.title} 아이템을 교환하시겠습니까?`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "교환 신청",
        style: "default",
        onPress: () => {
          // TODO: 교환 신청 API 연동
          Alert.alert("알림", "교환 신청 기능은 준비 중입니다.");
        },
      },
    ]);
  };

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
      <View
        style={[styles.container, { backgroundColor: colors.light.background }]}
      >
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>
          아이템 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  // 아이템 정보가 없는 경우
  if (!item) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.light.background }]}
      >
        <Text style={[styles.errorText, { color: textColor }]}>
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
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.light.background }]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: primaryColor }]}>
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
        <Text style={[styles.itemTitle, { color: textColor }]}>
          {item.title}
        </Text>

        <Text style={[styles.itemCategory, { color: textColor }]}>
          카테고리: {item.category === "TICKET" ? "경기 티켓" : "굿즈/상품"}
        </Text>

        <Text
          style={[
            styles.itemStatus,
            {
              color:
                item.status === "REGISTERED"
                  ? primaryColor
                  : item.status === "COMPLETED"
                    ? "#10B981"
                    : "#EF4444",
            },
          ]}
        >
          상태:{" "}
          {item.status === "REGISTERED"
            ? "등록됨"
            : item.status === "COMPLETED"
              ? "교환완료"
              : "교환실패"}
        </Text>

        <Text style={[styles.itemDescription, { color: textColor }]}>
          {item.description}
        </Text>

        <Text style={[styles.itemDate, { color: textColor }]}>
          등록일: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </Card>

      {/* 등록자 정보 */}
      <Card style={styles.userCard}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          등록자 정보
        </Text>
        <Text style={[styles.userName, { color: textColor }]}>
          {item.user.userNickname || item.user.nickname}
        </Text>
      </Card>

      {/* 액션 버튼 */}
      <View style={styles.actionContainer}>
        <Button
          variant="primary"
          onPress={handleExchangeRequest}
          loading={exchangeLoading}
          fullWidth
          style={styles.actionButton}
        >
          교환 신청
        </Button>

        <Button
          variant="outline"
          onPress={handleChatRequest}
          fullWidth
          style={styles.actionButton}
        >
          채팅하기
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  backButton: {
    marginTop: 20,
    maxWidth: 200,
  },
  imageCard: {
    marginBottom: 20,
  },
  itemImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  infoCard: {
    marginBottom: 20,
    padding: 20,
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  itemCategory: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  itemStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  itemDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  itemDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  userCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
  },
  actionContainer: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    minHeight: 50,
  },
});
