import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
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

import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import { itemsGetDetailAPI } from "@/src/features/exchange/api";
import { useAuth } from "@/src/hooks/useAuth";
import { theme } from "@/src/styles/theme";

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: theme.colors.border.light,
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
    fontSize: theme.typography.size.BODY,
    color: theme.colors.text.tertiary,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 40, // 하단 고정 바에 가리지 않도록 여백 추가
  },
  title: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  nickname: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  desiredItemContainer: {
    flex: 1,
  },
  desiredItemLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
  },
  desiredItemText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
  },
  actionButtonText: {
    color: theme.colors.background,
    fontWeight: theme.typography.weight.bold,
    fontSize: 15,
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
    padding: theme.spacing.SCREEN,
  },
  errorText: {
    fontSize: theme.typography.size.BODY,
    textAlign: "center",
    marginBottom: theme.spacing.COMPONENT,
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

  // 작성자 여부 확인 (권한 기반 UI 분리용) - TODO: 구현 필요
  // const isOwner = item?.data?.userId === user?.userId;

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
            const { width } = event.nativeEvent.layoutMeasurement;
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {item.data.images?.map((imageUrl: string, index: number) => (
            <View key={index} style={{ width: "100%", aspectRatio: 1 }}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>
          ))}
        </ScrollView>

        {/* 이미지 인디케이터 */}
        {item.data.images.length > 1 && (
          <View
            style={{
              position: "absolute",
              bottom: theme.spacing.SMALL,
              right: theme.spacing.SMALL,
              flexDirection: "row",
              gap: theme.spacing.TINY,
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

  // 상태 변경 핸들러 (작성자 전용) - TODO: 구현 필요
  // const handleStatusChange = useCallback(
  //   (status: string) => {
  //     Alert.alert("상태 변경", `${status} 상태로 변경하시겠습니까?`, [
  //       { text: "취소", style: "cancel" },
  //       {
  //         text: "확인",
  //         onPress: () => {
  //           // TODO: 상태 변경 API 호출
  //           Alert.alert("성공", "상태가 변경되었습니다.");
  //           refetch();
  //         },
  //       },
  //     ]);
  //   },
  //   [refetch],
  // );

  // 삭제 핸들러 (작성자 전용) - TODO: 구현 필요
  // const handleDelete = useCallback(() => {
  //   Alert.alert("삭제 확인", "정말로 이 아이템을 삭제하시겠습니까?", [
  //     { text: "취소", style: "cancel" },
  //     {
  //       text: "삭제",
  //       style: "destructive",
  //       onPress: () => {
  //         // TODO: 삭제 API 호출
  //         Alert.alert("성공", "아이템이 삭제되었습니다.");
  //         router.replace("/(tabs)/exchange");
  //       },
  //     },
  //   ]);
  // }, [router]);

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeLayout
        edges={["top", "bottom"]}
        style={{ backgroundColor: colors.background }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[{ color: colors.text, marginTop: theme.spacing.SMALL }]}
          >
            아이템 정보를 불러오는 중...
          </Text>
        </View>
      </SafeLayout>
    );
  }

  // 에러 상태
  if (error || !item?.data) {
    return (
      <SafeLayout
        edges={["top", "bottom"]}
        style={{ backgroundColor: colors.background }}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            아이템 정보를 불러올 수 없습니다.
          </Text>
          <Button onPress={() => refetch()}>다시 시도</Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: "#FFF" }}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 캐러셀 */}
        {renderImageCarousel()}

        {/* 작성자 프로필 영역 */}
        <View style={styles.profileRow}>
          {item.data.user?.profileImage ? (
            <Image
              source={{ uri: item.data.user.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View
              style={[
                styles.profileImage,
                {
                  backgroundColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {item.data.user?.nickname?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <Text style={[styles.nickname, { color: colors.text }]}>
            {item.data.user?.nickname || "알 수 없음"}
          </Text>
        </View>

        {/* 본문 영역 */}
        <View style={styles.contentContainer}>
          {/* 제목 */}
          <Text style={[styles.title, { color: colors.text }]}>
            {item.data.title}
          </Text>

          {/* 내용 */}
          <Text style={[styles.description, { color: colors.text }]}>
            {item.data.description}
          </Text>
        </View>
      </ScrollView>

      {/* 하단 고정 바 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>희망 아이템</Text>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 2 }}>
            {item.data.desiredItem || "없음"}
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#000000",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
          }}
          onPress={handleExchangeRequest}
          disabled={item.data.status !== "REGISTERED"}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 15 }}>
            교환 신청하기
          </Text>
        </TouchableOpacity>
      </View>
    </SafeLayout>
  );
}
