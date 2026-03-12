import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { SafeLayout } from "@/components/ui/safe-layout";
import { useTheme } from "@/hooks/useTheme";
import {
  exchangeCreateAPI,
  itemsGetMyItemsAPI,
} from "@/src/features/exchange/api";
import { CreateExchangeDto, Item } from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.SCREEN,
    paddingTop: SPACING.COMPONENT,
    paddingBottom: 100, // 하단 고정 버튼을 위한 여백
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
  listContainer: {
    marginBottom: SPACING.SECTION,
    height: "50%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 150,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.SECTION * 2,
    minHeight: 150,
  },
  emptyText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.COMPONENT,
    marginBottom: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.CARD,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.TINY,
  },
  itemCategory: {
    fontSize: FONT_SIZE.SMALL,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    marginBottom: SPACING.SECTION,
  },
  inputLabel: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  messageInput: {
    minHeight: 80,
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
    elevation: 5, // 안드로이드 용 그림자
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
  flatList: {
    flex: 1,
  },
});

/**
 * 교환 신청 화면 컴포넌트
 * 기존에 바텀시트로 동작하던 로직을 독립적인 페이지로 재구성
 */
export default function ApplyExchangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const targetItemId = Number(id);

  // 상태 관리
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // 내 아이템 목록 페칭
  const { data: myItems, isLoading } = useQuery({
    queryKey: ["myItems", user?.userId],
    queryFn: async () => {
      const response = await itemsGetMyItemsAPI(0, 50);
      if (response.resultType !== "SUCCESS" || !response.data) return [];
      const content = response.data.content;
      return Array.isArray(content) ? (content as Item[]) : [];
    },
    enabled: !!user?.userId, 
  });

  // 교환 신청 Mutation
  const { mutate: requestExchange, isPending } = useMutation({
    mutationFn: async () => {
      const payload: CreateExchangeDto = {
        itemId: targetItemId,
        message: message.trim(),
      };
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
      const roomId =
        typeof data === "object" && data !== null
          ? ((data as { roomId?: number; directRoomId?: number }).roomId ??
            (data as { roomId?: number; directRoomId?: number }).directRoomId)
          : undefined;

      if (!roomId) {
        Alert.alert("오류", "채팅방 ID를 가져올 수 없습니다.");
        return;
      }

      Alert.alert("성공", "교환 신청이 완료되었습니다.");

      // 상태 무효화
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      queryClient.invalidateQueries({ queryKey: ["item", id] });

      // 채팅방으로 이동시키며 교환 신청 페이지는 네비게이션 스택에서 제거
      router.replace(`/exchange/chat/${roomId}`);
    },
    onError: (error) => {
      Alert.alert("오류", "교환 신청에 실패했습니다.");
      Logger.error("교환 신청 실패:", error);
    },
  });

  // 아이템 선택 핸들러
  const handleItemSelect = useCallback((itemId: number) => {
    setSelectedItemId(itemId);
  }, []);

  // 제출 핸들러
  const handleSubmit = useCallback(() => {
    if (!selectedItemId) {
      Alert.alert("알림", "교환할 아이템을 선택해주세요.");
      return;
    }

    if (!message.trim()) {
      Alert.alert("알림", "교환 제안 메시지를 입력해주세요.");
      return;
    }

    requestExchange();
  }, [selectedItemId, message, requestExchange]);

  // 아이템 렌더링 컴포넌트
  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          {
            backgroundColor: colors.surface,
            borderColor:
              selectedItemId === item.id ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleItemSelect(item.id)}
      >
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.itemCategory, { color: colors.muted }]}>
            {item.category === "TICKET" ? "티켓" : "굿즈"}
          </Text>
        </View>
        <View
          style={[
            styles.radioButton,
            {
              backgroundColor:
                selectedItemId === item.id ? colors.primary : colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          {selectedItemId === item.id && (
            <View
              style={[
                styles.radioButtonInner,
                { backgroundColor: colors.background },
              ]}
            />
          )}
        </View>
      </TouchableOpacity>
    ),
    [selectedItemId, handleItemSelect, colors],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "교환 신청",
          headerBackTitleVisible: false,
          // 뒤로가기 버튼 강제 명시 (iOS/Android 공통 픽스)
          headerBackVisible: true,
        } as any}
      />
      <SafeLayout edges={["top", "bottom"]} style={{ ...styles.container, backgroundColor: colors.background }}>
        <FlatList
          style={styles.flatList}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          data={[]} // Header와 Footer를 활용해 전체 스크롤을 감쌈
          renderItem={null}
          ListHeaderComponent={
            <>
              {/* 헤더 안내 */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>아이템 선택</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  교환을 제안할 내 아이템을 하나 선택해주세요.
                </Text>
              </View>

              {/* 내 아이템 목록 */}
              <View style={styles.listContainer}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.emptyText, { color: colors.muted, marginTop: SPACING.SMALL }]}>
                      내 아이템을 불러오는 중...
                    </Text>
                  </View>
                ) : myItems?.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.muted }]}>
                      교환 가능한 윗(Wit)템이 없습니다.
                    </Text>
                  </View>
                ) : (
                  myItems?.map((item) => (
                    <React.Fragment key={item.id}>
                      {renderItem({ item })}
                    </React.Fragment>
                  ))
                )}
              </View>

              {/* 메시지 입력 폼 */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  교환 제안 메시지
                </Text>
                <Input
                  placeholder="예: 꼭 교환하고 싶어요! 상태 아주 좋습니다."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  style={styles.messageInput}
                />
              </View>
            </>
          }
        />

        {/* 하단 고정 제출 영역 */}
        <View
          style={[
            styles.bottomContainer,
            {
              backgroundColor: colors.background, // theme 동적 색상 적용
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20), // 🚨 Safe Area 동적 할당
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.applyButton,
              {
                backgroundColor:
                  !selectedItemId || !message.trim() || isPending ? colors.muted : colors.primary,
              },
            ]}
            onPress={handleSubmit}
            disabled={!selectedItemId || !message.trim() || isPending}
          >
            <Text
              style={[
                styles.submitButtonText,
                { color: colors.background },
              ]}
            >
              {isPending ? "신청 중..." : "교환 신청하기"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeLayout>
    </>
  );
}
