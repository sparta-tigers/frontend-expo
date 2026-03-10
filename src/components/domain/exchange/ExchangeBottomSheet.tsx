import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { Item } from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";

/**
 * 교환 신청 바텀시트 컴포넌트
 *
 * 작업 지시서 Phase 2 Target 4 구현
 * - Lazy Loading: 바텀시트 활성화 시점에만 데이터 페칭
 * - Atomic Routing: 교환 신청 성공 시 즉시 채팅방으로 이동
 * - 메모리 방어: 불필요한 네트워크 호출 차단
 */

interface ExchangeBottomSheetProps {
  /** 바텀시트 닫기 핸들러 */
  onClose: () => void;
  /** 바텀시트 열림 상태 */
  isOpen: boolean;
}

export const ExchangeBottomSheet: React.FC<ExchangeBottomSheetProps> = ({
  onClose,
  isOpen,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // 상태 관리
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // 🚨 앙드레 카파시: Lazy Loading - 바텀시트 활성화 시점에만 데이터 페칭
  const { data: myItems, isLoading } = useQuery({
    queryKey: ["myItems", user?.userId],
    queryFn: async () => {
      // TODO: 내 아이템 목록 API 호출
      // const response = await itemsGetMyItemsAPI(user?.userId);
      // return response.data;

      // Mock 데이터 (실제 API 연동 전)
      return [
        {
          id: 101,
          title: "내 티켓 1",
          description: "경기 티켓입니다",
          category: "TICKET" as const,
          status: "REGISTERED" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user?.userId || 0,
          user: { id: user?.userId || 0, nickname: user?.nickname || "나" },
          location: { latitude: 37.5665, longitude: 126.978, address: "서울" },
        },
        {
          id: 102,
          title: "내 굿즈 1",
          description: "응원 굿즈입니다",
          category: "GOODS" as const,
          status: "REGISTERED" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user?.userId || 0,
          user: { id: user?.userId || 0, nickname: user?.nickname || "나" },
          location: { latitude: 37.5665, longitude: 126.978, address: "서울" },
        },
      ] as Item[];
    },
    enabled: isOpen && !!user?.userId, // 바텀시트가 열리고 사용자가 있을 때만 활성화
  });

  // 🚨 앙드레 카파시: Atomic Routing - 교환 신청 Mutation
  const { mutate: requestExchange, isPending } = useMutation({
    mutationFn: async () => {
      // TODO: 교환 신청 API 호출
      /*
      const response = await exchangesCreateAPI({
        targetItemId,
        myItemId: selectedItemId!,
        message: message.trim(),
      });
      return response.data;
      */

      // Mock 응답 (실제 API 연동 전)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        roomId: 12345, // 생성된 채팅방 ID
        exchangeId: 67890, // 교환 신청 ID
      };
    },
    onSuccess: (data) => {
      // 성공 시 처리
      Alert.alert("성공", "교환 신청이 완료되었습니다.");

      // 1. 바텀시트 닫기
      onClose();

      // 2. 내 아이템 목록 상태 무효화
      queryClient.invalidateQueries({ queryKey: ["myItems"] });

      // 3. 🚨 앙드레 카파시: Atomic Routing - 즉시 채팅방으로 이동
      router.replace(`/exchange/chat/${data.roomId}`);
    },
    onError: (error) => {
      Alert.alert("오류", "교환 신청에 실패했습니다.");
      console.error("교환 신청 실패:", error);
    },
  });

  // 아이템 선택 핸들러
  const handleItemSelect = useCallback((itemId: number) => {
    setSelectedItemId(itemId);
  }, []);

  // 교환 신청 제출 핸들러
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

  // 바텀시트 열림/닫힘 감지
  React.useEffect(() => {
    if (isOpen && bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    } else if (!isOpen && bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, [isOpen]);

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
    <BottomSheet
      ref={bottomSheetRef}
      index={-1} // 기본적으로 닫힘
      snapPoints={["80%"]} // 화면 높이의 80%
      enablePanDownToClose={true}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>교환 신청</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            교환할 내 아이템을 선택해주세요
          </Text>
        </View>

        {/* 내 아이템 목록 */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                내 아이템을 불러오는 중...
              </Text>
            </View>
          ) : (
            <BottomSheetFlatList
              data={myItems}
              renderItem={renderItem}
              keyExtractor={(item: Item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    교환 가능한 아이템이 없습니다
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* 메시지 입력 */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            교환 제안 메시지
          </Text>
          <Input
            placeholder="교환하고 싶은 이유를 알려주세요"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            style={styles.messageInput}
          />
        </View>

        {/* 제출 버튼 */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleSubmit}
            disabled={!selectedItemId || !message.trim() || isPending}
            style={[
              styles.submitButton,
              {
                backgroundColor:
                  !selectedItemId || !message.trim() || isPending
                    ? colors.muted
                    : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.submitButtonText,
                {
                  color:
                    !selectedItemId || !message.trim() || isPending
                      ? colors.background
                      : colors.background,
                },
              ]}
            >
              {isPending ? "신청 중..." : "교환 신청하기"}
            </Text>
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
};

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.SCREEN,
    paddingTop: SPACING.COMPONENT,
  },
  header: {
    alignItems: "center",
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
    flex: 1,
    marginBottom: SPACING.SECTION,
  },
  listContent: {
    paddingBottom: SPACING.COMPONENT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.SECTION * 2,
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
  },
  buttonContainer: {
    paddingBottom: SPACING.COMPONENT,
  },
  submitButton: {
    paddingVertical: SPACING.COMPONENT,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
    textAlign: "center",
  },
});
