import { SafeLayout } from "@/components/ui/safe-layout";
import {
  itemsDeleteAPI,
  itemsGetDetailAPI,
  itemsUpdateStatusAPI,
} from "@/src/features/exchange/api";
import { useAuth } from "@/src/hooks/useAuth";
import { theme } from "@/src/styles/theme";

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
  FlatList,
  Dimensions,
} from "react-native";

import ImageViewing from "react-native-image-viewing";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- 정적 스타일 정의 (SSOT 기반) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // 하단 버튼 높이만큼 여백 확보
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
    backgroundColor: theme.colors.border.medium,
  },
  nickname: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  contentContainer: {
    padding: theme.spacing.COMPONENT,
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.SMALL,
  },
  description: {
    fontSize: theme.typography.size.BODY,
    lineHeight: 22,
    color: theme.colors.text.primary,
  },
  desiredItemLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
  },
  desiredItemText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
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
    color: theme.colors.background,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  exchangeButtonText: {
    fontWeight: "bold",
    fontSize: 15,
    color: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.text.primary,
    marginTop: theme.spacing.SMALL,
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
    color: theme.colors.text.primary,
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
    borderColor: theme.colors.background,
  },
  indicatorDotActive: {
    backgroundColor: theme.colors.primary,
  },
  indicatorDotInactive: {
    backgroundColor: theme.colors.background,
  },
  profileInitialText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text.secondary,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.background,
    zIndex: 100,
    elevation: 5,
  },
  applyButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
  },
  applyButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  headerRightContainer: {
    flexDirection: "row",
    gap: theme.spacing.COMPONENT,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.border.medium,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
    textAlign: "center",
    color: theme.colors.text.primary,
  },
  headerActionButton: {
    paddingHorizontal: theme.spacing.SMALL,
    paddingVertical: 4,
  },
  editText: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.primary,
  },
  deleteText: {
    fontSize: theme.typography.size.BODY,
    color: theme.colors.error,
  },
  statusCompleted: {
    color: theme.colors.primary,
  },
  statusFailed: {
    color: theme.colors.error,
  },
  statusDefault: {
    color: theme.colors.text.primary,
  },
  statusActionTextDestructive: {
    color: theme.colors.error,
  },
});

/**
 * 교환글 상세 화면 컴포넌트
 */
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const itemIdNumber = Number(id);

  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsGetDetailAPI(itemIdNumber),
    staleTime: 0,
    enabled: !!id && user !== null,
  });

  const itemUserObjId = item?.data?.user?.userId ?? item?.data?.userId;
  const myUserId = user?.userId;

  const isOwner =
    typeof itemUserObjId !== "undefined" &&
    typeof myUserId !== "undefined" &&
    Number(itemUserObjId) === Number(myUserId);

  const renderImageCarousel = useCallback(() => {
    const images = item?.data?.imageUrls ?? item?.data?.images ?? [];

    if (images.length === 0) {
      return (
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>이미지 없음</Text>
          </View>
        </View>
      );
    }

    const formattedImages = images.map((url: string) => ({
      uri: url,
    }));

    return (
      <View style={styles.imageCarousel}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => `image-${index}`}
          onMomentumScrollEnd={(event) => {
            const { width } = event.nativeEvent.layoutMeasurement;
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          renderItem={({ item: imageUrl, index }) => (
            <TouchableOpacity
              style={[styles.imageContainer, { width: SCREEN_WIDTH }]}
              onPress={() => {
                setImageViewerIndex(index);
                setIsImageViewerVisible(true);
              }}
            >
              <Image source={{ uri: getImageUrl(imageUrl as string) }} style={styles.image} />
            </TouchableOpacity>
          )}
        />

        {images.length > 1 && (
          <View style={styles.indicatorContainer}>
            {images.map((_: string, index: number) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  index === currentImageIndex ? styles.indicatorDotActive : styles.indicatorDotInactive,
                ]}
              />
            ))}
          </View>
        )}

        <ImageViewing
          images={formattedImages}
          imageIndex={imageViewerIndex}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
          swipeToCloseEnabled={true}
        />
      </View>
    );
  }, [item, currentImageIndex, imageViewerIndex, isImageViewerVisible]);

  const handleExchangeRequest = useCallback(() => {
    if (!user?.accessToken) {
      Alert.alert("로그인 필요", "교환 신청을 위해 로그인이 필요합니다.");
      return;
    }
    router.push(`/exchange/apply/${id}` as any);
  }, [user, id, router]);

  const { mutate: updateItemStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async (newStatus: "COMPLETED" | "FAILED") => {
      const targetId = item?.data?.id;
      if (!targetId) throw new Error("itemId가 없습니다.");
      const response = await itemsUpdateStatusAPI(targetId, newStatus);
      if (response.resultType !== "SUCCESS") throw new Error("status update failed");
      return true;
    },
    onSuccess: () => {
      Alert.alert("성공", "상태가 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: () => {
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    },
  });

  const handleStatusChange = useCallback(
    (newStatus: "COMPLETED" | "FAILED") => {
      if (!item?.data) return;
      Alert.alert(
        "상태 변경",
        newStatus === "COMPLETED" ? "교환을 완료 상태로 변경하시겠습니까?" : "교환을 취소 상태로 변경하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "확인", onPress: () => updateItemStatus(newStatus) },
        ],
      );
    },
    [item?.data, updateItemStatus],
  );

  const { mutate: deleteItem } = useMutation({
    mutationFn: () => itemsDeleteAPI(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      router.replace("/(tabs)/exchange");
    },
    onError: () => {
      Alert.alert("삭제 실패", "아이템 삭제에 실패했습니다.");
    },
  });

  const handleDelete = useCallback(() => {
    Alert.alert("게시글 삭제", "정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteItem() },
    ]);
  }, [deleteItem]);

  if (user === null && !isLoading) {
    return (
      <SafeLayout style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>로그인이 필요합니다.</Text>
          <Button onPress={() => router.back()} variant="outline">돌아가기</Button>
        </View>
      </SafeLayout>
    );
  }

  if (isLoading) {
    return (
      <SafeLayout style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeLayout>
    );
  }

  if (error || !item?.data) {
    return (
      <SafeLayout style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>정보를 불러올 수 없습니다.</Text>
          <Button onPress={() => refetch()}>다시 시도</Button>
        </View>
      </SafeLayout>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true } as any} />

      <SafeLayout edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.customHeader}>
          <Text style={styles.headerTitle} numberOfLines={1}>아이템 상세</Text>
          <View style={styles.headerRightContainer}>
            {isOwner && (
              <>
                <TouchableOpacity
                  onPress={() => router.push(`/exchange/edit/${id}` as any)}
                  style={styles.headerActionButton}
                >
                  <Text style={styles.editText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.headerActionButton}>
                  <Text style={styles.deleteText}>삭제</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderImageCarousel()}

          <View style={styles.profileRow}>
            {item.data.user?.profileImage ? (
              <Image source={{ uri: getImageUrl(item.data.user.profileImage) }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImage}>
                <Text style={styles.profileInitialText}>
                  {item.data.user?.userNickname?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <Text style={styles.nickname}>{item.data.user?.userNickname || "알 수 없음"}</Text>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.title}>{item.data.title}</Text>
            <Text style={styles.description}>{item.data.description}</Text>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.desiredItemContainer}>
              <Text style={styles.desiredItemLabel}>희망 아이템</Text>
              <Text style={styles.desiredItemText}>{item.data.desiredItem || "없음"}</Text>
            </View>

            {isOwner && (
              <View style={styles.buttonRow}>
                <View style={styles.statusSection}>
                  <View style={styles.statusInfoRow}>
                    <Text style={styles.statusLabel}>현재 상태</Text>
                    <Text style={[
                      styles.statusValue,
                      item.data.status === "COMPLETED" ? styles.statusCompleted : 
                      item.data.status === "FAILED" ? styles.statusFailed : styles.statusDefault
                    ]}>
                      {item.data.status === "REGISTERED" ? "교환 대기" : 
                       item.data.status === "COMPLETED" ? "교환 완료" : "교환 취소"}
                    </Text>
                  </View>

                  <View style={styles.statusActionsRow}>
                    <Button
                      style={styles.statusActionButton}
                      disabled={item.data.status !== "REGISTERED" || isUpdatingStatus}
                      onPress={() => handleStatusChange("COMPLETED")}
                    >
                      <Text style={styles.statusActionText}>교환 완료로 표시</Text>
                    </Button>
                    <Button
                      variant="outline"
                      style={styles.statusActionButton}
                      disabled={item.data.status !== "REGISTERED" || isUpdatingStatus}
                      onPress={() => handleStatusChange("FAILED")}
                    >
                      <Text style={[styles.statusActionText, styles.statusActionTextDestructive]}>
                        교환 취소로 표시
                      </Text>
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {isOwner ? (
            <TouchableOpacity style={styles.applyButton} onPress={() => router.push("/exchange/requests")}>
              <Text style={styles.exchangeButtonText}>대화중인 채팅</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.applyButton, item.data.status !== "REGISTERED" && styles.applyButtonDisabled]}
              onPress={handleExchangeRequest}
              disabled={item.data.status !== "REGISTERED"}
            >
              <Text style={styles.exchangeButtonText}>교환 제안하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeLayout>
    </>
  );
}
