import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
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

import { apiClient } from "@/src/core/client";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { itemsUpdateStatusAPI } from "@/src/features/exchange/api";
import { useAuth } from "@/src/hooks/useAuth";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { theme } from "@/src/styles/theme";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  type?: "CHAT" | "SYSTEM";
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
  exchangeStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.SCREEN,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    color: theme.colors.text.primary,
  },
  itemHeader: {
    padding: SPACING.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.medium,
    backgroundColor: theme.colors.surface,
  },
  itemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
    marginBottom: SPACING.TINY,
    color: theme.colors.text.primary,
  },
  itemDescription: {
    fontSize: FONT_SIZE.SMALL,
    marginBottom: SPACING.TINY,
    color: theme.colors.text.tertiary,
  },
  itemStatus: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
    color: theme.colors.primary,
  },
  statusButtons: {
    flexDirection: "row",
    gap: SPACING.SMALL,
  },
  statusButton: {
    flex: 1,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
    backgroundColor: theme.colors.primary,
  },
  statusButtonMuted: {
    flex: 1,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
    backgroundColor: theme.colors.text.tertiary,
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
    color: theme.colors.background,
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    color: theme.colors.text.tertiary,
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
    color: theme.colors.background,
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
    backgroundColor: theme.colors.primary,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
  },
  messageText: {
    fontSize: FONT_SIZE.BODY,
  },
  messageTextMine: {
    color: theme.colors.background,
  },
  messageTextOther: {
    color: theme.colors.text.primary,
  },
  senderName: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.TINY,
    color: theme.colors.text.tertiary,
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
    borderTopColor: theme.colors.border.medium,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.BUTTON,
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
    borderColor: theme.colors.border.medium,
  },
  sendButton: {
    marginLeft: theme.spacing.SMALL,
    paddingHorizontal: theme.spacing.COMPONENT,
    paddingVertical: theme.spacing.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
    backgroundColor: theme.colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.text.tertiary,
  },
  sendButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    color: theme.colors.background,
  },
});

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [messageText, setMessageText] = useState("");
  const roomIdNumber = Number(roomId);

  const isRoomIdInvalid =
    !roomId || !Number.isFinite(roomIdNumber) || roomIdNumber <= 0;

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
      exchangeItem?.status === "COMPLETED" ||
      exchangeItem?.status === "DELETED" ||
      exchangeItem?.exchangeStatus === "PENDING" ||
      exchangeItem?.exchangeStatus === "REJECTED"
    );
  }, [exchangeItem?.status, exchangeItem?.exchangeStatus]);

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
      const messages = response.data?.content ?? [];

      const mapped: ChatMessage[] = messages.map((message) => ({
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

  const {
    client,
    connect,
    status: wsStatus,
  } = useWebSocket(roomId, "directroom");
  const isConnected = wsStatus === "CONNECTED";

  const handleMessageReceived = useCallback(
    (newMessage: ChatMessage) => {
      queryClient.setQueryData(
        ["chatMessages", roomIdNumber],
        (oldData: InfiniteData<ChatMessagesPage, number> | undefined) => {
          if (!oldData || oldData.pages.length === 0) return oldData;

          const prevContent = oldData.pages[0].content;

          const cleanList = prevContent.filter(
            (msg) =>
              !(
                msg.id < 0 &&
                msg.senderId === newMessage.senderId &&
                msg.content === newMessage.content
              ),
          );

          if (cleanList.some((msg) => msg.id === newMessage.id)) {
            return oldData;
          }

          const nextPages = [...oldData.pages];
          nextPages[0] = {
            ...nextPages[0],
            content: [newMessage, ...cleanList],
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
      id: -Date.now(),
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
            messageId?: number;
            id?: number;
            roomId: number;
            senderId: number;
            senderNickname?: string;
            senderName?: string;
            message?: string;
            content?: string;
            sentAt?: string;
            timestamp?: string;
            createdAt?: string;
            type?: "CHAT" | "SYSTEM";
            action?: string;
          };

          if (parsed.type === "SYSTEM" && parsed.action === "STATUS_UPDATED") {
            queryClient.invalidateQueries({ queryKey: ["exchangeItem", roomIdNumber] });
            return;
          }

          const normalized: ChatMessage = {
            id: parsed.messageId ?? parsed.id ?? Date.now(),
            roomId: roomIdNumber,
            senderId: parsed.senderId,
            senderName: parsed.senderNickname ?? parsed.senderName ?? "",
            content: parsed.message ?? parsed.content ?? "",
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
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [client, handleMessageReceived, isConnected, queryClient, roomIdNumber, user?.userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        void connect();
        queryClient.invalidateQueries({
          queryKey: ["chatMessages", roomIdNumber],
        });
      } else if (nextAppState === "background") {
        void client?.deactivate();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [client, connect, queryClient, roomIdNumber]);

  const { mutate: updateItemStatus } = useMutation({
    mutationFn: async (newStatus: "COMPLETE" | "CANCEL") => {
      if (!exchangeItem?.itemId) throw new Error("itemId missing");
      const response = await itemsUpdateStatusAPI(
        exchangeItem.itemId,
        newStatus,
      );
      if (response.resultType !== "SUCCESS") {
        throw new Error("status update failed");
      }
      return true;
    },
    onSuccess: () => {
      Alert.alert("성공", "상태가 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["exchangeItem", roomId] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      queryClient.invalidateQueries({ queryKey: ["myExchanges"] });
    },
    onError: () => {
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    },
  });

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

  const renderExchangeItemHeader = () => (
    <View style={styles.itemHeader}>
      {itemLoading ? (
        <Text style={styles.loadingText}>아이템 정보를 불러오는 중...</Text>
      ) : exchangeItem ? (
        <View>
          <Text style={styles.itemTitle}>{exchangeItem.title}</Text>
          <Text style={styles.itemDescription}>{exchangeItem.description}</Text>
          <Text style={styles.itemStatus}>
            상태:{" "}
            {exchangeItem.status === "REGISTERED"
              ? "등록됨"
              : exchangeItem.status === "COMPLETED"
                ? "교환 완료"
                : "교환 취소"}
          </Text>

          {exchangeItem.status === "REGISTERED" && (
            <View style={styles.statusButtons}>
              {exchangeItem.ownerId === user?.userId ? (
                <>
                  <TouchableOpacity
                    onPress={() => handleStatusChange("COMPLETE")}
                    style={styles.statusButton}
                  >
                    <Text style={styles.statusButtonText}>교환 완료하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStatusChange("CANCEL")}
                    style={styles.statusButtonError}
                  >
                    <Text style={styles.statusButtonText}>거절하기</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.statusButtonMuted}>
                  <Text style={styles.statusButtonText}>교환 대기 중</Text>
                </View>
              )}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );

  if (isRoomIdInvalid) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>채팅방 연결 오류: ID 없음</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {renderExchangeItemHeader()}

      <View
        style={[
          styles.connectionStatus,
          isConnected
            ? styles.connectionStatusConnected
            : styles.connectionStatusDisconnected,
        ]}
      >
        <Text style={styles.connectionStatusText}>
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
            ]}
          >
            {!item.isMine && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                item.isMine ? styles.messageTextMine : styles.messageTextOther,
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
              <Text style={styles.loadingText}>이전 메시지 로딩 중...</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder={
            exchangeItem?.exchangeStatus === "PENDING"
              ? "아직 수락 대기 중인 교환 요청입니다"
              : exchangeItem?.exchangeStatus === "REJECTED"
                ? "거절된 교환 요청입니다"
                : isInputDisabled
                  ? "종료된 교환입니다"
                  : "메시지를 입력하세요"
          }
          placeholderTextColor={theme.colors.text.tertiary}
          editable={!isInputDisabled}
          style={styles.textInput}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={isInputDisabled || !messageText.trim()}
          style={[
            styles.sendButton,
            (isInputDisabled || !messageText.trim()) && styles.sendButtonDisabled
          ]}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
