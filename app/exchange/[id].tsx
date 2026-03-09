import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import { itemsGetDetailAPI } from "@/src/features/exchange/api";
import { useAuth } from "@/src/hooks/useAuth";

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: FONT_SIZE.BODY,
    color: "#999",
  },
  contentContainer: {
    padding: SPACING.SCREEN,
  },
  title: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
    marginBottom: SPACING.COMPONENT,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SECTION,
  },
  category: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: SPACING.SMALL / 2,
    borderRadius: BORDER_RADIUS.BUTTON,
    overflow: "hidden",
  },
  date: {
    fontSize: FONT_SIZE.CAPTION,
    color: "#666",
  },
  status: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: SPACING.SMALL / 2,
    borderRadius: BORDER_RADIUS.BUTTON,
    overflow: "hidden",
  },
  description: {
    fontSize: FONT_SIZE.BODY,
    lineHeight: 24,
    marginBottom: SPACING.SECTION,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.SECTION_TITLE,
    fontWeight: "bold",
    marginBottom: SPACING.COMPONENT,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.COMPONENT,
    borderRadius: BORDER_RADIUS.CARD,
    marginBottom: SPACING.SECTION,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.COMPONENT,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.COMPONENT,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.SMALL / 2,
  },
  userDate: {
    fontSize: FONT_SIZE.CAPTION,
    color: "#666",
  },
  desiredItemContainer: {
    padding: SPACING.COMPONENT,
    borderRadius: BORDER_RADIUS.CARD,
    marginBottom: SPACING.SECTION,
  },
  desiredItemTitle: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  desiredItemText: {
    fontSize: FONT_SIZE.BODY,
  },
  bottomActionBar: {
    flexDirection: "row",
    padding: SPACING.SCREEN,
    borderTopWidth: 1,
    gap: SPACING.SMALL,
  },
  actionButton: {
    flex: 1,
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
    padding: SPACING.SCREEN,
  },
  errorText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    marginBottom: SPACING.COMPONENT,
  },
});

/**
 * 교환글 상세 화면 컴포넌트
 *
 * 작업 지시서 Phase 1 Target 2 구현
 * - React Query로 데이터 관리 (staleTime: 0)
 * - 권한 기반 UI 분기 (작성자 vs 타인)
 * - 이미지 캐러셀 (ScrollView pagingEnabled)
 * - 하단 액션 바
 */
export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // React Query로 아이템 상세 정보 가져오기
  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsGetDetailAPI(Number(id)),
    staleTime: 0, // 항상 최신 상태 유지
    enabled: !!id,
  });

  // 작성자 여부 확인
  const isOwner = item?.data?.userId === user?.userId;

  // 이미지 캐러셀 렌더링
  const renderImageCarousel = useCallback(() => {
    if (!item?.data?.images || item.data.images.length === 0) {
      return (
        <View
          style={[styles.imageContainer, { backgroundColor: colors.border }]}
        >
          <View style={styles.imagePlaceholder}>
            <Text
              style={[styles.imagePlaceholderText, { color: colors.muted }]}
            >
              이미지 없음
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / 300);
            setCurrentImageIndex(index);
          }}
        >
          {item.data.images?.map((imageUrl: string, index: number) => (
            <View key={index} style={{ width: 300, height: 300 }}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>
          ))}
        </ScrollView>

        {/* 이미지 인디케이터 */}
        {item.data.images.length > 1 && (
          <View
            style={{
              position: "absolute",
              bottom: SPACING.SMALL,
              right: SPACING.SMALL,
              flexDirection: "row",
              gap: SPACING.TINY,
            }}
          >
            {item.data.images?.map((_: string, index: number) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    index === currentImageIndex
                      ? colors.primary
                      : colors.background,
                  borderWidth: 1,
                  borderColor: colors.background,
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  }, [item, colors, currentImageIndex]);

  // 교환 신청 핸들러 (타인 전용)
  const handleExchangeRequest = useCallback(() => {
    if (!user?.accessToken) {
      Alert.alert("로그인 필요", "교환 신청을 위해 로그인이 필요합니다.");
      return;
    }

    // TODO: 바텀시트 트랜잭션 구현 (Phase 2)
    Alert.alert("교환 신청", "교환 신청 기능은 Phase 2에서 구현됩니다.");
  }, [user]);

  // 상태 변경 핸들러 (작성자 전용)
  const handleStatusChange = useCallback(
    (status: string) => {
      Alert.alert("상태 변경", `${status} 상태로 변경하시겠습니까?`, [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: () => {
            // TODO: 상태 변경 API 호출
            Alert.alert("성공", "상태가 변경되었습니다.");
            refetch();
          },
        },
      ]);
    },
    [refetch],
  );

  // 삭제 핸들러 (작성자 전용)
  const handleDelete = useCallback(() => {
    Alert.alert("삭제 확인", "정말로 이 아이템을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          // TODO: 삭제 API 호출
          Alert.alert("성공", "아이템이 삭제되었습니다.");
          router.replace("/(tabs)/exchange");
        },
      },
    ]);
  }, [router]);

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.text, marginTop: SPACING.SMALL }]}>
            아이템 정보를 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (error || !item?.data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            아이템 정보를 불러올 수 없습니다.
          </Text>
          <Button onPress={() => refetch()}>다시 시도</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 캐러셀 */}
        {renderImageCarousel()}

        {/* 콘텐츠 */}
        <View style={styles.contentContainer}>
          {/* 제목 */}
          <Text style={[styles.title, { color: colors.text }]}>
            {item.data.title}
          </Text>

          {/* 메타 정보 */}
          <View style={styles.metaContainer}>
            <Text
              style={[
                styles.category,
                {
                  backgroundColor: colors.primary + "20",
                  color: colors.primary,
                },
              ]}
            >
              {item.data.category === "TICKET" ? "티켓" : "굿즈"}
            </Text>
            <Text style={[styles.date, { color: colors.muted }]}>
              {new Date(item.data.createdAt).toLocaleDateString()}
            </Text>
            <Text
              style={[
                styles.status,
                {
                  backgroundColor:
                    item.data.status === "REGISTERED"
                      ? colors.success + "20"
                      : item.data.status === "EXCHANGE_COMPLETED"
                        ? colors.primary + "20"
                        : colors.destructive + "20",
                  color:
                    item.data.status === "REGISTERED"
                      ? colors.success
                      : item.data.status === "EXCHANGE_COMPLETED"
                        ? colors.primary
                        : colors.destructive,
                },
              ]}
            >
              {item.data.status === "REGISTERED"
                ? "등록됨"
                : item.data.status === "EXCHANGE_COMPLETED"
                  ? "교환완료"
                  : "교환실패"}
            </Text>
          </View>

          {/* 설명 */}
          <Text style={[styles.description, { color: colors.text }]}>
            {item.data.description}
          </Text>

          {/* 희망 아이템 */}
          {item.data.desiredItem && (
            <Card
              style={[
                styles.desiredItemContainer,
                { backgroundColor: colors.surface, shadowColor: colors.border },
              ]}
            >
              <Text
                style={[styles.desiredItemTitle, { color: colors.primary }]}
              >
                희망 교환 물품
              </Text>
              <Text style={[styles.desiredItemText, { color: colors.text }]}>
                {item.data.desiredItem}
              </Text>
            </Card>
          )}

          {/* 등록자 정보 */}
          <Card
            style={[
              styles.userInfoContainer,
              { backgroundColor: colors.surface, shadowColor: colors.border },
            ]}
          >
            {item.data.user?.profileImage ? (
              <Image
                source={{ uri: item.data.user.profileImage }}
                style={styles.userAvatar}
              />
            ) : (
              <View
                style={[
                  styles.userAvatarPlaceholder,
                  { backgroundColor: colors.border },
                ]}
              >
                <Text style={{ color: colors.muted, fontSize: 16 }}>
                  {item.data.user?.nickname?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {item.data.user?.nickname || "알 수 없음"}
              </Text>
              <Text style={[styles.userDate, { color: colors.muted }]}>
                {new Date(item.data.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* 하단 액션 바 - 권한 기반 분기 */}
      <View
        style={[
          styles.bottomActionBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {isOwner ? (
          // 작성자 액션
          <>
            <Button
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleStatusChange("EXCHANGE_COMPLETED")}
            >
              <Text style={{ color: colors.background }}>교환 완료</Text>
            </Button>
            <Button
              style={[
                styles.actionButton,
                { backgroundColor: colors.destructive },
              ]}
              onPress={handleDelete}
            >
              <Text style={{ color: colors.background }}>삭제</Text>
            </Button>
          </>
        ) : (
          // 타인 액션
          <Button
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleExchangeRequest}
            disabled={item.data.status !== "REGISTERED"}
          >
            <Text style={{ color: colors.background }}>
              {item.data.status === "REGISTERED"
                ? "교환 신청하기"
                : "교환 불가"}
            </Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
