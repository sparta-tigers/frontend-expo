import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { apiClient } from "@/src/core/client";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { itemsUpdateStatusAPI } from "@/src/features/exchange/api";
import { useAuth } from "@/src/hooks/useAuth";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { theme } from "@/src/styles/theme";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

/**
 * 교환 채팅방 화면 컴포넌트
 *
 * 작업 지시서 Phase 2 Target 5 구현
 * - STOMP + AppState: 백그라운드/포그라운드 전환 감지
 * - FlashList Inverted: 하단에서 상단으로 메시지 쌓기
 * - 상태 동기화: 채팅방 내 상태 변경 시 React Query 캐시 무효화
 */

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  type?: "CHAT" | "SYSTEM"; // Target 15: 시스템 메시지 타입 추가
}

interface ChatMessagesPage {
  content: ChatMessage[];
  hasNext: boolean;
}

interface ExchangeItem {
  itemId: number;
  title: string;
  description: string;
  category: "TICKET" | "GOODS";
  status: "REGISTERED" | "COMPLETED" | "FAILED" | "DELETED";
  ownerId: number;
  ownerNickname: string;
}

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [messageText, setMessageText] = useState("");

  const roomIdNumber = Number(roomId);

  // 상태 관리: 메시지 입력 기능 확장 시 활용 예정

  // 🚨 앙드레 카파시: 아이템 정보 조회 (도메인 상태 결합)
  const { data: exchangeItem, isLoading: itemLoading } = useQuery({
    queryKey: ["exchangeItem", roomId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/direct-rooms/${roomIdNumber}/item`,
      );
      return response.data as ExchangeItem;
    },
    enabled: !!roomId,
  });

  const isInputDisabled = useMemo(() => {
    return (
      exchangeItem?.status === "COMPLETED" || exchangeItem?.status === "DELETED"
    );
  }, [exchangeItem?.status]);

  // 🚨 앙드레 카파시: 과거 메시지 조회
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ChatMessagesPage>({
    queryKey: ["chatMessages", roomIdNumber],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await chatroomsGetMessagesAPI(
        roomIdNumber,
        pageParam as number,
      );
      /**
       * [BUG FIX] 백엔드 Page<DirectRoomMessageResponse> 파스 수정
       * 개선 전: response.data?.messages (ChatMessageListResponse.messages)
       * 개선 후: response.data?.content (Page.content) — 백엔드 Page 구조 실제 필드명
       */
      const messages = response.data?.content ?? [];

      const mapped: ChatMessage[] = messages.map((message) => ({
        /**
         * [BUG FIX] DirectRoomMessageResponse 필드명 정합
         * - messageId (NOT id)
         * - message 필드를 content로 매핑 (NOT message.content)
         * - senderNickname (NOT sender?.nickname / senderNickName)
         */
        id: message.messageId,
        roomId: roomIdNumber,
        senderId: message.senderId,
        senderName: message.senderNickname,
        content: message.message,
        timestamp: message.sentAt,
        isMine: message.isMyMessage ?? false,
        type: "CHAT" as const,
      }));

      const hasNext = mapped.length > 0;
      return { content: mapped, hasNext };
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNext ? allPages.length : undefined,
    enabled: Number.isFinite(roomIdNumber) && roomIdNumber > 0,
    initialPageParam: 0,
  });

  const flattenedMessages = useMemo(() => {
    const pages = messagesData?.pages ?? [];
    return pages.flatMap((page) => page.content);
  }, [messagesData]);

  // 🚨 앙드레 카파시: STOMP WebSocket 연결
  const {
    client,
    connect,
    status: wsStatus,
  } = useWebSocket(undefined, "directroom");
  const isConnected = wsStatus === "CONNECTED";

  const handleMessageReceived = useCallback(
    (newMessage: ChatMessage) => {
      queryClient.setQueryData(
        ["chatMessages", roomIdNumber],
        (oldData: InfiniteData<ChatMessagesPage, number> | undefined) => {
          if (!oldData || oldData.pages.length === 0) return oldData;
          const nextPages = [...oldData.pages];
          nextPages[0] = {
            ...nextPages[0],
            content: [newMessage, ...nextPages[0].content],
          };
          return { ...oldData, pages: nextPages };
        },
      );
    },
    [queryClient, roomIdNumber],
  );

  const handleSendMessage = useCallback(() => {
    if (!client || !isConnected) {
      Alert.alert(
        "연결 오류",
        "서버와 연결이 불안정합니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    if (!user?.userId) {
      Alert.alert("로그인 필요", "메시지를 전송하려면 로그인이 필요합니다.");
      return;
    }

    if (!messageText.trim()) return;

    const now = new Date().toISOString();
    const optimistic: ChatMessage = {
      id: Date.now(),
      roomId: roomIdNumber,
      senderId: user.userId,
      senderName: user.nickname ?? "",
      content: messageText.trim(),
      timestamp: now,
      isMine: true,
      type: "CHAT",
    };

    handleMessageReceived(optimistic);
    setMessageText("");

    try {
      client.publish({
        destination: "/client/directRoom/send",
        body: JSON.stringify({
          roomId: roomIdNumber,
          message: optimistic.content,
        }),
      });
    } catch (error) {
      Logger.error(
        "[ChatRoom] send message error:",
        error instanceof Error ? error.message : String(error),
      );
      Alert.alert("전송 실패", "메시지 전송에 실패했습니다.");
    }
  }, [
    client,
    handleMessageReceived,
    isConnected,
    messageText,
    roomIdNumber,
    user,
  ]);

  useEffect(() => {
    if (!client || !isConnected || !Number.isFinite(roomIdNumber)) return;

    const subscription = client.subscribe(
      `/server/directRoom/${roomIdNumber}`,
      (message) => {
        try {
          const parsed = JSON.parse(message.body) as {
            id: number;
            roomId: number;
            senderId: number;
            senderName?: string;
            content: string;
            timestamp?: string;
            sentAt?: string;
            createdAt?: string;
            type?: "CHAT" | "SYSTEM";
          };

          const normalized: ChatMessage = {
            id: parsed.id,
            roomId: roomIdNumber,
            senderId: parsed.senderId,
            senderName: parsed.senderName ?? "",
            content: parsed.content,
            timestamp:
              parsed.sentAt ??
              parsed.timestamp ??
              parsed.createdAt ??
              new Date().toISOString(),
            isMine: parsed.senderId === (user?.userId ?? -1),
            type: parsed.type ?? "CHAT",
          };

          handleMessageReceived(normalized);
        } catch (error) {
          Logger.error("[ChatRoom] message parse error:", error);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, handleMessageReceived, isConnected, roomIdNumber, user?.userId]);

  // 🚨 앙드레 카파시: AppState 이벤트 리스너 (백그라운드/포그라운드 전환 감지)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // 포그라운드 복귀 시 STOMP 재연결
        Logger.debug("📱 [AppState] 앱이 활성화되었습니다.");
        void connect();

        // 백그라운드 중 누락된 메시지 REST 패칭
        queryClient.invalidateQueries({
          queryKey: ["chatMessages", roomIdNumber],
        });
      } else if (nextAppState === "background") {
        // 백그라운드 전환 시 STOMP 비활성화 (배터리 최적화)
        Logger.debug("📱 [AppState] 앱이 백그라운드로 전환되었습니다.");
        void client?.deactivate();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [client, connect, queryClient, roomIdNumber]);

  // 🚨 앙드레 카파시: 상태 변경 Mutation
  const { mutate: updateItemStatus } = useMutation({
    mutationFn: async (newStatus: "COMPLETE" | "CANCEL") => {
      if (!exchangeItem?.itemId) throw new Error("itemId missing");
      const response = await itemsUpdateStatusAPI(exchangeItem.itemId, newStatus);
      if (response.resultType !== "SUCCESS") {
        throw new Error("status update failed");
      }
      return true;
    },
    onSuccess: () => {
      Alert.alert("성공", "상태가 변경되었습니다.");

      // 🚨 앙드레 카파시: 도메인 상태 결합 - 채팅방 상단 UI 리렌더링
      queryClient.invalidateQueries({ queryKey: ["exchangeItem", roomId] });

      // 🚨 앙드레 카파시: 상태 동기화 - 관련 캐시 모두 무효화
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      queryClient.invalidateQueries({ queryKey: ["myExchanges"] });
    },
    onError: () => {
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    },
  });

  // 상태 변경 버튼 핸들러
  const handleStatusChange = useCallback(
    (newStatus: "COMPLETE" | "CANCEL") => {
      Alert.alert(
        "확인",
        newStatus === "COMPLETE"
          ? "교환을 확정하시겠습니까?"
          : "교환을 취소하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "확인", onPress: () => updateItemStatus(newStatus) },
        ],
      );
    },
    [updateItemStatus],
  );

  // 아이템 정보 헤더
  const renderExchangeItemHeader = () => (
    <View style={[styles.itemHeader, { backgroundColor: colors.surface }]}>
      {itemLoading ? (
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          아이템 정보를 불러오는 중...
        </Text>
      ) : exchangeItem ? (
        <View>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {exchangeItem.title}
          </Text>
          <Text style={[styles.itemDescription, { color: colors.muted }]}>
            {exchangeItem.description}
          </Text>
          <Text style={[styles.itemStatus, { color: colors.primary }]}>
            상태:{" "}
            {exchangeItem.status === "REGISTERED"
              ? "등록됨"
              : exchangeItem.status === "COMPLETED"
                ? "교환 완료"
                : "교환 취소"}
          </Text>

          {/* Target 14: 채팅방 상태 제어 UI - 소유자/요청자 화면 분기 */}
          {exchangeItem.status === "REGISTERED" && (
            <View style={styles.statusButtons}>
              {exchangeItem.ownerId === user?.userId ? (
                // 아이템 소유자(Seller) 화면
                <>
                  <Button
                    onPress={() => handleStatusChange("COMPLETE")}
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: colors.background },
                      ]}
                    >
                      교환 완료하기
                    </Text>
                  </Button>
                  <Button
                    onPress={() => handleStatusChange("CANCEL")}
                    style={styles.statusButtonError}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: colors.background },
                      ]}
                    >
                      거절하기
                    </Text>
                  </Button>
                </>
              ) : (
                // 요청자(Buyer) 화면
                <Button
                  onPress={() =>
                    Alert.alert("알림", "교환 확정은 소유자만 할 수 있습니다.")
                  }
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      { color: colors.background },
                    ]}
                  >
                    교환 대기 중
                  </Text>
                </Button>
              )}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: "교환 채팅",
          headerShown: true,
        }}
      />
      {/* 아이템 정보 헤더 */}
      {renderExchangeItemHeader()}

      {/* 연결 상태 표시 */}
      <View
        style={[
          styles.connectionStatus,
          isConnected
            ? styles.connectionStatusConnected
            : styles.connectionStatusDisconnected,
        ]}
      >
        <Text
          style={[styles.connectionStatusText, { color: colors.background }]}
        >
          {isConnected ? "연결됨" : "연결 끊김"}
        </Text>
      </View>

      <FlatList
        inverted={true}
        data={flattenedMessages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messageListContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.isMine ? styles.myBubble : styles.otherBubble,
              {
                backgroundColor: item.isMine ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: item.isMine ? colors.background : colors.text },
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.paginationLoading}>
              <ActivityIndicator size="small" />
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                이전 메시지 로딩 중...
              </Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.inputBar, { borderTopColor: colors.border }]}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder={
            isInputDisabled ? "종료된 교환입니다" : "메시지를 입력하세요"
          }
          placeholderTextColor={colors.muted}
          editable={!isInputDisabled}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={isInputDisabled || !messageText.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor:
                isInputDisabled || !messageText.trim()
                  ? colors.muted
                  : colors.primary,
            },
          ]}
        >
          <Text style={[styles.sendButtonText, { color: colors.background }]}>
            전송
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemHeader: {
    padding: SPACING.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.bottom,
  },
  itemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
    marginBottom: SPACING.TINY,
  },
  itemDescription: {
    fontSize: FONT_SIZE.SMALL,
    marginBottom: SPACING.TINY,
  },
  itemStatus: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
  },
  statusButtons: {
    flexDirection: "row",
    gap: SPACING.SMALL,
  },
  statusButton: {
    flex: 1,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  statusButtonError: {
    backgroundColor: theme.colors.error,
    flex: 1,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  statusButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
  },
  connectionStatus: {
    paddingVertical: SPACING.TINY,
    alignItems: "center",
  },
  connectionStatusConnected: {
    backgroundColor: theme.colors.success,
  },
  connectionStatusDisconnected: {
    backgroundColor: theme.colors.error,
  },
  connectionStatusText: {
    fontSize: FONT_SIZE.CAPTION,
    fontWeight: "600",
  },
  messageListContent: {
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.CARD,
    marginVertical: SPACING.TINY,
  },
  myBubble: {
    alignSelf: "flex-end",
  },
  otherBubble: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: FONT_SIZE.BODY,
  },
  paginationLoading: {
    paddingVertical: SPACING.SMALL,
    alignItems: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.BUTTON,
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    fontSize: FONT_SIZE.BODY,
  },
  sendButton: {
    marginLeft: SPACING.SMALL,
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  sendButtonText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
  },
});
