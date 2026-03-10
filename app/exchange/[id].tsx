import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import { itemsDeleteAPI, itemsGetDetailAPI } from "@/src/features/exchange/api";
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
    color: theme.colors.text.secondary,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.COMPONENT,
    gap: theme.spacing.SMALL,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nickname: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
  },
  contentContainer: {
    padding: theme.spacing.COMPONENT,
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    marginBottom: theme.spacing.SMALL,
  },
  description: {
    fontSize: theme.typography.size.BODY,
    lineHeight: 22,
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
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
  },
  desiredItemContainer: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  errorButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  exchangeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  exchangeButtonText: {
    fontWeight: "bold",
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
  imageCarousel: {
    width: "100%",
    aspectRatio: 1,
  },
  indicatorContainer: {
    position: "absolute",
    bottom: theme.spacing.SMALL,
    right: theme.spacing.SMALL,
    flexDirection: "row",
    gap: theme.spacing.TINY,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  profileInitialText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButtonText: {
    fontWeight: "bold",
    fontSize: 15,
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
  const router = useRouter();
  const queryClient = useQueryClient();
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

  // 작성자 여부 확인 (권한 기반 UI 분리용)
  const isOwner = item?.data?.user?.id === user?.userId;

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
      <View style={styles.imageCarousel}>
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
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>
          ))}
        </ScrollView>

        {/* 이미지 인디케이터 */}
        {item.data.images.length > 1 && (
          <View style={styles.indicatorContainer}>
            {item.data.images?.map((_: string, index: number) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  {
                    backgroundColor:
                      index === currentImageIndex
                        ? colors.primary
                        : colors.background,
                    borderColor: colors.background,
                  },
                ]}
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

  // 삭제 Mutation
  const { mutate: deleteItem } = useMutation({
    mutationFn: () => itemsDeleteAPI(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      router.replace("/(tabs)/exchange");
    },
    onError: () => {
      Alert.alert(
        "삭제 실패",
        "아이템 삭제에 실패했습니다. 다시 시도해주세요.",
      );
    },
  });

  // 삭제 핸들러 (작성자 전용)
  const handleDelete = useCallback(() => {
    Alert.alert("게시글 삭제", "정말 삭제하시겠습니까? 복구할 수 없습니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteItem(),
      },
    ]);
  }, [deleteItem]);

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
    <SafeLayout edges={["top", "bottom"]} style={styles.container}>
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
              style={[styles.profileImage, { backgroundColor: colors.border }]}
            >
              <Text
                style={[styles.profileInitialText, { color: colors.muted }]}
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
      <View style={[styles.bottomBar, { borderColor: colors.border }]}>
        <View style={styles.desiredItemContainer}>
          <Text style={[styles.desiredItemLabel, { color: colors.muted }]}>
            희망 아이템
          </Text>
          <Text style={[styles.desiredItemText, { color: colors.text }]}>
            {item.data.desiredItem || "없음"}
          </Text>
        </View>

        {/* 권한 기반 버튼 분기 */}
        {isOwner ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.errorButton} onPress={handleDelete}>
              <Text
                style={[styles.deleteButtonText, { color: colors.background }]}
              >
                삭제하기
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.exchangeButton,
              {
                backgroundColor:
                  item.data.status === "REGISTERED"
                    ? colors.primary
                    : colors.muted,
              },
            ]}
            onPress={handleExchangeRequest}
            disabled={item.data.status !== "REGISTERED"}
          >
            <Text
              style={[styles.exchangeButtonText, { color: colors.background }]}
            >
              교환 신청하기
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeLayout>
  );
}
