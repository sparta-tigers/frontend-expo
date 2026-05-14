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
import { type Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";

import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";

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
  contentContainer: {
    padding: theme.spacing.COMPONENT,
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
  statusActionsRow: {
    flexDirection: "row",
    gap: theme.spacing.TINY,
    marginTop: theme.spacing.TINY,
  },
  statusActionButton: {
    flex: 1,
    paddingVertical: theme.spacing.TINY,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
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
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.background,
    zIndex: 100,
    elevation: 5,
  },
  applyButton: {
    height: theme.layout.common.standardItemHeight,
    borderRadius: theme.radius.md,
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
    height: theme.layout.common.standardItemHeight,
    paddingHorizontal: theme.spacing.COMPONENT,
    borderBottomWidth: 1,
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.border.medium,
  },
  headerActionButton: {
    paddingHorizontal: theme.spacing.SMALL,
    paddingVertical: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
  },
  descriptionText: {
    lineHeight: 22,
  },
});

/**
 * 교환글 상세 화면 컴포넌트
 */
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const itemIdNumber = Number(id);

  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const {
    data: item,
    isLoading: isItemLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsGetDetailAPI(itemIdNumber),
    staleTime: 0,
    enabled: !!id && !isAuthLoading && user !== null,
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
        <Box style={styles.imageContainer}>
          <Box style={styles.imagePlaceholder}>
            <Typography variant="body2" color="text.secondary">이미지 없음</Typography>
          </Box>
        </Box>
      );
    }

    const formattedImages = images.map((url: string) => ({
      uri: url,
    }));

    return (
      <Box style={styles.imageCarousel}>
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
          <Box style={styles.indicatorContainer}>
            {images.map((_: string, index: number) => (
              <Box
                key={index}
                style={[
                  styles.indicatorDot,
                  index === currentImageIndex ? styles.indicatorDotActive : styles.indicatorDotInactive,
                ]}
              />
            ))}
          </Box>
        )}

        <ImageViewing
          images={formattedImages}
          imageIndex={imageViewerIndex}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
          swipeToCloseEnabled={true}
        />
      </Box>
    );
  }, [item, currentImageIndex, imageViewerIndex, isImageViewerVisible]);

  const handleExchangeRequest = useCallback(() => {
    if (!user?.accessToken) {
      Alert.alert("로그인 필요", "교환 신청을 위해 로그인이 필요합니다.");
      return;
    }
    router.push(`/exchange/apply/${id}` as Href);
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
      void queryClient.invalidateQueries({ queryKey: ["item", id] });
      void queryClient.invalidateQueries({ queryKey: ["items"] });
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
      void queryClient.invalidateQueries({ queryKey: ["items"] });
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

  if (user === null && !isAuthLoading && !isItemLoading) {
    return (
      <SafeLayout style={styles.container}>
        <Box style={styles.errorContainer}>
          <Typography variant="body1" center mb="md">
            로그인이 필요합니다.
          </Typography>
          <Button onPress={() => router.back()} variant="outline">돌아가기</Button>
        </Box>
      </SafeLayout>
    );
  }

  if (isAuthLoading || isItemLoading) {
    return (
      <SafeLayout style={styles.container}>
        <Box style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography variant="body2" color="text.secondary" mt="sm">
            불러오는 중...
          </Typography>
        </Box>
      </SafeLayout>
    );
  }

  if (error || !item?.data) {
    return (
      <SafeLayout style={styles.container}>
        <Box style={styles.errorContainer}>
          <Typography variant="body1" center mb="md">
            정보를 불러올 수 없습니다.
          </Typography>
          <Button onPress={() => refetch()}>다시 시도</Button>
        </Box>
      </SafeLayout>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />

      <SafeLayout edges={["top", "bottom"]} style={styles.container}>
        <Box style={styles.customHeader}>
          <Typography variant="body1" weight="bold" center style={styles.headerTitle}>
            아이템 상세
          </Typography>
          <Box style={styles.headerRightContainer}>
            {isOwner && (
              <>
                <TouchableOpacity
                  onPress={() => router.push(`/exchange/edit/${id}` as Href)}
                  style={styles.headerActionButton}
                >
                  <Typography variant="body2" color="brand.mint">수정</Typography>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.headerActionButton}>
                  <Typography variant="body2" color="error">삭제</Typography>
                </TouchableOpacity>
              </>
            )}
          </Box>
        </Box>
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderImageCarousel()}

          <Box style={styles.profileRow}>
            {item.data.user?.profileImage ? (
              <Image source={{ uri: getImageUrl(item.data.user.profileImage) }} style={styles.profileImage} />
            ) : (
              <Box style={styles.profileImage} justify="center" align="center">
                <Typography variant="body1" weight="bold" color="text.secondary">
                  {item.data.user?.userNickname?.[0]?.toUpperCase() || "U"}
                </Typography>
              </Box>
            )}
            <Typography variant="body1" weight="bold">{item.data.user?.userNickname || "알 수 없음"}</Typography>
          </Box>

          <Box style={styles.contentContainer}>
            <Typography variant="h3" weight="bold" mb="sm">
              {item.data.title}
            </Typography>
            <Typography variant="body1" style={styles.descriptionText}>
              {item.data.description}
            </Typography>
          </Box>

          <Box style={styles.bottomBar}>
            <Box style={styles.desiredItemContainer}>
              <Typography variant="caption" color="text.secondary">희망 아이템</Typography>
              <Typography variant="body1" weight="bold" mt="xxs">
                {item.data.desiredItem || "없음"}
              </Typography>
            </Box>

            {isOwner && (
              <Box style={styles.buttonRow}>
                <Box style={styles.statusSection}>
                  <Box style={styles.statusInfoRow}>
                    <Typography variant="caption" color="text.secondary">현재 상태</Typography>
                    <Typography
                      variant="body2"
                      weight="bold"
                      color={
                        item.data.status === "COMPLETED" ? "brand.mint" : 
                        item.data.status === "FAILED" ? "error" : "primary"
                      }
                    >
                      {item.data.status === "REGISTERED" ? "교환 대기" : 
                       item.data.status === "COMPLETED" ? "교환 완료" : "교환 취소"}
                    </Typography>
                  </Box>

                  <Box style={styles.statusActionsRow}>
                    <Button
                      style={styles.statusActionButton}
                      disabled={item.data.status !== "REGISTERED" || isUpdatingStatus}
                      onPress={() => handleStatusChange("COMPLETED")}
                    >
                      <Typography variant="caption" weight="medium" color="background" center>
                        교환 완료로 표시
                      </Typography>
                    </Button>
                    <Button
                      variant="outline"
                      style={styles.statusActionButton}
                      disabled={item.data.status !== "REGISTERED" || isUpdatingStatus}
                      onPress={() => handleStatusChange("FAILED")}
                    >
                      <Typography variant="caption" weight="medium" color="error" center>
                        교환 취소로 표시
                      </Typography>
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </ScrollView>

        <Box style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {isOwner ? (
            <TouchableOpacity style={styles.applyButton} onPress={() => router.push("/exchange/requests" as Href)}>
              <Typography variant="body1" weight="bold" color="background">대화중인 채팅</Typography>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.applyButton, item.data.status !== "REGISTERED" && styles.applyButtonDisabled]}
              onPress={handleExchangeRequest}
              disabled={item.data.status !== "REGISTERED"}
            >
              <Typography variant="body1" weight="bold" color="background">교환 제안하기</Typography>
            </TouchableOpacity>
          )}
        </Box>
      </SafeLayout>
    </>
  );
}
