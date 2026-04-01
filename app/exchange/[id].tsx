import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import {
  itemsDeleteAPI,
  itemsGetDetailAPI,
  itemsUpdateStatusAPI,
} from "@/src/features/exchange/api";
import { useAuth } from "@/src/hooks/useAuth";
import { theme } from "@/src/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { getImageUrl } from "@/src/utils/url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import ImageViewing from "react-native-image-viewing";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // 🚨 하단 버튼 높이만큼 여백 확보
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
  statusSection: {
    flex: 1,
    paddingRight: theme.spacing.SMALL,
  },
  statusInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.TINY,
  },
  statusLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
  },
  statusValue: {
    fontSize: theme.typography.size.SMALL,
    fontWeight: theme.typography.weight.bold,
  },
  statusActionsRow: {
    flexDirection: "row",
    gap: theme.spacing.TINY,
    marginTop: theme.spacing.TINY,
  },
  statusActionButton: {
    flex: 1,
    paddingVertical: theme.spacing.TINY,
  },
  statusActionText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
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
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    zIndex: 100,
    elevation: 5, // 안드로이드 그림자
  },
  applyButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightContainer: {
    flexDirection: "row",
    gap: theme.spacing.COMPONENT,
  },
  headerLeftButton: {
    padding: 8,
    marginRight: 4,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    textAlign: "center",
  },
  headerActionButton: {
    paddingHorizontal: theme.spacing.SMALL,
    paddingVertical: 4,
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const itemIdNumber = Number(id);

  // 라이트박스 상태 관리
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // React Query로 아이템 상세 정보 가져오기
  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsGetDetailAPI(itemIdNumber),
    staleTime: 0, // 항상 최신 상태 유지
    enabled: !!id,
  });

  // \ubc31\uc5d4\ub4dc DTO \ud544\ub4dc \ud63c\uc6a9 \uac00\ub2a5\uc131(userId vs id)\uc5d0 \ub300\ube44\ud558\uc5ec \ud0c4\ub825\uc801\uc73c\ub85c \ucd94\ucd9c
  const itemUserObjId =
    item?.data?.user?.userId ??
    (item?.data?.user as any)?.id ??
    item?.data?.userId;
  const myUserId = user?.userId;

  // 항상 Number() 변환으로 타입 불일치 방지
  const isOwner = Number(itemUserObjId) === Number(myUserId) && !!myUserId;

  // 이미지 캐러셀 렌더링
  const renderImageCarousel = useCallback(() => {
    // [P1-3] 백엔드는 imageUrls로 반환 — imageUrls 우선, images 하위 호환 fallback
    const images = item?.data?.imageUrls ?? item?.data?.images ?? [];

    if (images.length === 0) {
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

    // ImageViewing을 위한 이미지 포맷 변환
    const formattedImages = images.map((url: string) => ({
      uri: url,
    }));

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
          {images.map((imageUrl: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.imageContainer}
              onPress={() => {
                setImageViewerIndex(index);
                setIsImageViewerVisible(true);
              }}
            >
              <Image source={{ uri: getImageUrl(imageUrl) }} style={styles.image} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 이미지 인디케이터 */}
        {images.length > 1 && (
          <View style={styles.indicatorContainer}>
            {images.map((_: string, index: number) => (
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

        {/* ImageViewing 라이트박스 */}
        <ImageViewing
          images={formattedImages}
          imageIndex={imageViewerIndex}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
          swipeToCloseEnabled={true}
        />
      </View>
    );
  }, [item, colors, currentImageIndex, imageViewerIndex, isImageViewerVisible]);

  // 교환 신청 핸들러 (타인 전용) - 전용 페이지로 라우팅
  const handleExchangeRequest = useCallback(() => {
    if (!user?.accessToken) {
      Alert.alert("로그인 필요", "교환 신청을 위해 로그인이 필요합니다.");
      return;
    }

    router.push(`/exchange/apply/${id}` as any);
  }, [user, id, router]);

  // 상태 변경 핸들러 (작성자 전용) - 기존 구현 제거됨
  // const handleStatusChange = useCallback(
  //   (status: string) => {
  //     Alert.alert("상태 변경", `${status} 상태로 변경하시겠습니까?`, [
  //       { text: "취소", style: "cancel" },
  //       {
  //         text: "확인",
  //         onPress: () => {
  //           // 상태 변경 API 호출 (이전 구현 주석 처리됨)
  //           Alert.alert("성공", "상태가 변경되었습니다.");
  //           refetch();
  //         },
  //       },
  //     ]);
  //   },

  // 상태 변경 Mutation (작성자 전용)
  const { mutate: updateItemStatus, isPending: isUpdatingStatus } = useMutation(
    {
      mutationFn: async (newStatus: "COMPLETED" | "FAILED") => {
        const targetId = item?.data?.id;
        if (!targetId) {
          throw new Error("itemId가 없습니다.");
        }
        const response = await itemsUpdateStatusAPI(targetId, newStatus);
        if (response.resultType !== "SUCCESS") {
          throw new Error("status update failed");
        }
        return true;
      },
      onSuccess: () => {
        Alert.alert("성공", "상태가 변경되었습니다.");
        queryClient.invalidateQueries({ queryKey: ["item", id] });
        queryClient.invalidateQueries({ queryKey: ["items"] });
        queryClient.invalidateQueries({ queryKey: ["myItems"] });
        queryClient.invalidateQueries({ queryKey: ["myExchanges"] });
      },
      onError: () => {
        Alert.alert("오류", "상태 변경에 실패했습니다.");
      },
    },
  );

  // 상태 변경 핸들러 (작성자 전용)
  const handleStatusChange = useCallback(
    (newStatus: "COMPLETED" | "FAILED") => {
      if (!item?.data) return;

      Alert.alert(
        "상태 변경",
        newStatus === "COMPLETED"
          ? "교환을 완료 상태로 변경하시겠습니까?"
          : "교환을 취소 상태로 변경하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "확인", onPress: () => updateItemStatus(newStatus) },
        ],
      );
    },
    [item?.data, updateItemStatus],
  );

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
    <>
      {/* headerShown: false + 컴포넌트 내부 커스텀 헤더로 iOS 뒤로가기 해결 */}
      <Stack.Screen
        options={
          {
            headerShown: false, // iOS/Android 모두 시스템 헤더 비활화
            gestureEnabled: true, // iOS 스와이프 제스처 허용
            gestureDirection: "horizontal", // 왕포와이프 방향
          } as any
        }
      />

      {/* 컴포넌트 내부 커스텀 헤더 (항상 보임) */}
      <SafeLayout edges={["top", "bottom"]} style={styles.container}>
        {/* 커스텀 헤더 영역 */}
        <View
          style={[
            styles.customHeader,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerLeftButton}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            아이템 상세
          </Text>
          <View style={styles.headerRightContainer}>
            {isOwner && (
              <>
                <TouchableOpacity
                  onPress={() => router.push(`/exchange/edit/${id}` as any)}
                  style={styles.headerActionButton}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.size.BODY,
                      color: colors.primary,
                    }}
                  >
                    수정
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.headerActionButton}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.size.BODY,
                      color: colors.destructive,
                    }}
                  >
                    삭제
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent} // 🚨 하단 버튼 높이만큼 여백 확보
          showsVerticalScrollIndicator={false}
        >
          {/* 이미지 캐러셀 */}
          {renderImageCarousel()}

          {/* 작성자 프로필 영역 */}
          <View style={styles.profileRow}>
            {item.data.user?.profileImage ? (
              <Image
                source={{ uri: getImageUrl(item.data.user.profileImage) }}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={[
                  styles.profileImage,
                  { backgroundColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.profileInitialText, { color: colors.muted }]}
                >
                  {item.data.user?.userNickname?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <Text style={[styles.nickname, { color: colors.text }]}>
              {item.data.user?.userNickname || "알 수 없음"}
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

          {/* 하단 고정 바 (본문 영역 내부로 이동) */}
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
            {isOwner && (
              <View style={styles.buttonRow}>
                <View style={styles.statusSection}>
                  <View style={styles.statusInfoRow}>
                    <Text style={[styles.statusLabel, { color: colors.muted }]}>
                      현재 상태
                    </Text>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color:
                            item.data.status === "COMPLETED"
                              ? colors.primary
                              : item.data.status === "FAILED"
                                ? colors.destructive
                                : colors.text,
                        },
                      ]}
                    >
                      {item.data.status === "REGISTERED"
                        ? "교환 대기"
                        : item.data.status === "COMPLETED"
                          ? "교환 완료"
                          : item.data.status === "FAILED"
                            ? "교환 취소"
                            : item.data.status === "DELETED"
                              ? "삭제됨"
                              : item.data.status}
                    </Text>
                  </View>

                  <View style={styles.statusActionsRow}>
                    <Button
                      style={styles.statusActionButton}
                      disabled={
                        item.data.status !== "REGISTERED" || isUpdatingStatus
                      }
                      onPress={() => handleStatusChange("COMPLETED")}
                    >
                      <Text
                        style={[
                          styles.statusActionText,
                          { color: colors.background },
                        ]}
                      >
                        교환 완료로 표시
                      </Text>
                    </Button>
                    <Button
                      variant="outline"
                      style={styles.statusActionButton}
                      disabled={
                        item.data.status !== "REGISTERED" || isUpdatingStatus
                      }
                      onPress={() => handleStatusChange("FAILED")}
                    >
                      <Text
                        style={[
                          styles.statusActionText,
                          { color: colors.destructive },
                        ]}
                      >
                        교환 취소로 표시
                      </Text>
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 고정 버튼 영역 */}
        <View
          style={[
            styles.bottomContainer,
            {
              backgroundColor: colors.background, // theme 동적 색상
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20), // 🚨 Safe Area 동적 할당 (핵심)
            },
          ]}
        >
          {isOwner ? (
            <TouchableOpacity
              style={[
                styles.applyButton,
                {
                  backgroundColor: colors.primary, // 주도적인 컬러 사용
                },
              ]}
              onPress={() => router.push("/exchange/requests")}
            >
              <Text
                style={[
                  styles.exchangeButtonText,
                  { color: colors.background },
                ]}
              >
                대화중인 채팅
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.applyButton,
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
                style={[
                  styles.exchangeButtonText,
                  { color: colors.background },
                ]}
              >
                교환 제안하기
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeLayout>
    </>
  );
}
