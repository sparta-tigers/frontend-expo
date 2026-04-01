// app/exchange/apply/[id].tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Input } from "@/components/ui/input";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import { exchangeCreateAPI, itemsGetDetailAPI } from "@/src/features/exchange/api";
import { CreateExchangeDto } from "@/src/features/exchange/types";
import { FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.SCREEN,
    paddingTop: SPACING.COMPONENT,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingWrapper: {
    flex: 1,
  },
  targetItemBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.COMPONENT,
    marginBottom: SPACING.SECTION,
  },
  targetItemLabel: {
    fontSize: FONT_SIZE.SMALL,
    marginBottom: 4,
  },
  targetItemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "700",
  },
  header: {
    marginBottom: SPACING.SECTION,
  },
  title: {
    fontSize: FONT_SIZE.TITLE,
    fontWeight: "bold",
    marginBottom: SPACING.SMALL / 2,
  },
  subtitle: {
    fontSize: FONT_SIZE.BODY,
  },
  inputContainer: {
    marginBottom: SPACING.SECTION,
  },
  inputLabel: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  requiredMark: {
    // 업데이트 시 텔마 색상 사용 - 인라인 스타일 없이 런타임 적용
    fontWeight: "700",
  },
  haveInput: {
    minHeight: 120,
    textAlignVertical: "top",
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
    elevation: 5,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    textAlign: "center",
  },
  applyButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLeftButton: {
    marginLeft: 0,
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
  },
});

/**
 * 교환 제안 화면
 *
 * - 백엔드 ExchangeRequestDto 스펙: { receiverId, itemId, have }
 * - receiverId: 아이템 등록자 userId (itemsGetDetailAPI로 조회)
 * - have: 내가 제안하는 교환 물건 설명 (@NotBlank, 필수)
 */
export default function ApplyExchangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const targetItemId = Number(id);

  /** 내가 제안하는 교환 물건 설명 (필수, 백엔드 have 필드) */
  const [have, setHave] = useState("");

  // 교환 대상 아이템 조회 (receiverId 추출용)
  const { data: targetItem, isLoading: isItemLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: () => itemsGetDetailAPI(targetItemId),
    enabled: !!id,
  });

  const { mutate: requestExchange, isPending } = useMutation({
    mutationFn: async () => {
      // \ubc31\uc5d4\ub4dc DTO \ud544\ub4dc \ud63c\uc6a9 \uac00\ub2a5\uc131 \ub300\ube44 (userId ?? id ?? topLevel userId)
      const receiverId = targetItem?.data?.user?.userId ?? (targetItem?.data?.user as any)?.id ?? targetItem?.data?.userId;

      if (!receiverId) {
        throw new Error("상대방 정보를 가져올 수 없습니다.");
      }

      if (!have.trim()) {
        throw new Error("교환 제안 물건 설명을 입력해주세요.");
      }

      const payload: CreateExchangeDto = {
        receiverId: Number(receiverId),
        itemId: targetItemId,
        have: have.trim(),
      };

      Logger.debug("[교환 제안] payload:", payload);

      const response = await exchangeCreateAPI(payload);
      if (response.resultType !== "SUCCESS") {
        throw new Error(
          typeof response.error === "string"
            ? response.error
            : "교환 신청에 실패했습니다.",
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      // 백엔드 ExchangeRoomResponseDto: { directRoomId, exchangeRequestId }
      // directRoomId 를 우선 참조하고 roomId 는 fallback으로만 사용
      const roomId =
        (data as { directRoomId?: number; roomId?: number })?.directRoomId ??
        (data as { directRoomId?: number; roomId?: number })?.roomId;

      queryClient.invalidateQueries({ queryKey: ["item", id] });

      if (roomId) {
        Alert.alert("성공", "교환 제안이 전달되었습니다!");
        router.replace(`/exchange/chat/${roomId}`);
      } else {
        Alert.alert("성공", "교환 제안이 전달되었습니다. 상대가 수락하면 채팅이 시작됩니다.");
        router.back();
      }
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : "교환 신청에 실패했습니다.";
      Alert.alert("오류", msg);
      Logger.error("교환 신청 실패:", error);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!have.trim()) {
      Alert.alert("입력 필요", "교환을 제안할 물건을 설명해주세요.");
      return;
    }
    requestExchange();
  }, [have, requestExchange]);

  if (isItemLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "교환 제안하기",
            headerBackTitleVisible: false,
            headerBackVisible: true,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerLeftButton}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          } as any}
        />
        <SafeLayout style={styles.loadingWrapper}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeLayout>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "교환 제안하기",
          headerBackTitleVisible: false,
          headerBackVisible: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerLeftButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        } as any}
      />
      <SafeLayout edges={["top", "bottom"]} style={{ ...styles.container, backgroundColor: colors.background }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 교환 대상 아이템 표시 */}
          {targetItem?.data && (
            <View style={[styles.targetItemBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.targetItemLabel, { color: colors.muted }]}>교환 요청 대상 아이템</Text>
              <Text style={[styles.targetItemTitle, { color: colors.text }]}>
                {targetItem.data.title}
              </Text>
            </View>
          )}

          {/* 헤더 안내 */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>내가 제안하는 물건</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              교환하고 싶은 내 물건을 설명해주세요. 상대방에게 전달됩니다.
            </Text>
          </View>

          {/* have 입력 폼 (필수) */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              교환 물건 설명 <Text style={styles.requiredMark}>*</Text>
            </Text>
            <Input
              placeholder="예: BTS 콘서트 포토카드 세트, 상태 최상 / 스타필드 팝업 굿즈"
              value={have}
              onChangeText={setHave}
              multiline
              numberOfLines={6}
              style={styles.haveInput}
            />
          </View>
        </ScrollView>

        {/* 하단 고정 제출 영역 */}
        <View
          style={[
            styles.bottomContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.applyButton,
              {
                backgroundColor: !have.trim() || isPending ? colors.muted : colors.primary,
              },
            ]}
            onPress={handleSubmit}
            disabled={!have.trim() || isPending}
          >
            <Text
              style={[
                styles.submitButtonText,
                { color: colors.background },
              ]}
            >
              {isPending ? "신청 중..." : "제안 보내기"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    </>
  );
}
