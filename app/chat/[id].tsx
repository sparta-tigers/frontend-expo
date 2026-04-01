import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import { SafeLayout } from "@/components/ui/safe-layout";
import { apiClient } from "@/src/core/client";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { ChatMessage } from "@/src/features/chat/types";
import { useAuth } from "@/src/hooks/useAuth";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { ApiResponse } from "@/src/shared/types/common";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";

/**
 * DirectRoomItemResponseDto에 대응하는 프론트엔드 DTO.
 * Java DTO(`DirectRoomItemResponseDto`)를 TypeScript 인터페이스로 옮긴 형태이다.
 */
interface DirectRoomItemDto {
  itemId: number;
  title: string;
  description: string;
  category: "TICKET" | "GOODS";
  status: "REGISTERED" | "COMPLETED" | "FAILED" | "DELETED";
  ownerId: number;
  ownerNickname: string;
}

/**
 * 채팅방 상세 화면
 * 작업 지시서 Target 4 구현
 * - 상단 고정 아이템 요약 정보
 * - 채팅 말풍선 (내 메시지: 우측 꼬리, 상대 메시지: 좌측 꼬리)
 * - 시스템 메시지: 중앙 정렬 둥근 필
 * - 하단 입력 폼: 둥근 Input + 전송 버튼
 */
export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, sendMessage } = useWebSocket(undefined, "directroom");
  const { user } = useAuth();

  const [inputMessage, setInputMessage] = useState("");
  const directRoomId = Number(id);

  const { data: roomItem } = useQuery({
    queryKey: ["directRoomItem", directRoomId],
    queryFn: async () => {
      if (!Number.isFinite(directRoomId)) {
        throw new Error("유효하지 않은 채팅방 ID입니다.");
      }

      const response = await apiClient.get(
        `/api/direct-rooms/${directRoomId}/item`,
      );
      return response.data as DirectRoomItemDto;
    },
    enabled: Number.isFinite(directRoomId),
  });

  const isRoomCompleted =
    roomItem?.status === "COMPLETED" || roomItem?.status === "DELETED";

  // useAsyncState 훅으로 메시지 상태 관리
  const [messagesState, loadMessages] = useAsyncState<ChatMessage[]>([]);

  // 초기 메시지 로드
  const fetchInitialMessages = useCallback(async () => {
    if (!id) throw new Error("채팅방 ID가 없습니다.");

    const response: ApiResponse<any> = await chatroomsGetMessagesAPI(
      Number(id),
      0,
      50,
    );

    if (response.resultType === "SUCCESS" && response.data) {
      const messageData: any[] = response.data.content || [];

      // 서버 데이터를 UI 데이터로 변환
      const formattedMessages: ChatMessage[] = messageData.map((msg) => ({
        id: msg.id,
        directRoomId: msg.directRoomId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        sentAt: msg.sentAt,
        sender: msg.sender,
        senderNickName: msg.senderNickName,
        isMyMessage: user?.userId ? msg.senderId === user.userId : false,
      }));

      return formattedMessages;
    }

    throw new Error("메시지를 불러올 수 없습니다.");
  }, [id, user?.userId]);

  // 초기 데이터 로드
  useEffect(() => {
    loadMessages(fetchInitialMessages());
  }, [loadMessages, fetchInitialMessages]);

  // 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (
      !inputMessage.trim() ||
      !id ||
      status !== "CONNECTED" ||
      isRoomCompleted
    ) {
      return;
    }
    if (!user?.userId) return;

    try {
      const messageContent = inputMessage.trim();
      const myMessage: ChatMessage = {
        id: Date.now(),
        directRoomId: Number(id),
        senderId: user.userId,
        content: messageContent,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        sender: {
          id: user.userId,
          nickname: user.nickname ?? "",
        },
        senderNickName: user.nickname ?? "",
        isMyMessage: true,
      };

      // 메시지 전송
      sendMessage("/client/directRoom/send", {
        roomId: Number(id),
        message: messageContent,
      });

      // UI에 즉시 반영
      loadMessages(Promise.resolve([myMessage, ...(messagesState.data || [])]));
      setInputMessage("");
    } catch (error) {
      Logger.error(
        "메시지 전송 에러:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }, [
    inputMessage,
    id,
    status,
    isRoomCompleted,
    user?.userId,
    user?.nickname,
    sendMessage,
    messagesState.data,
    loadMessages,
  ]);

  // 메시지 아이템 렌더링 (작업 지시서 기준 말풍선 디자인)
  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    // 시스템 메시지 처리 (senderId가 0인 경우 시스템 메시지로 간주)
    if (item.senderId === 0) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageBubble}>
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            item.isMyMessage
              ? styles.myMessageBubble
              : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: item.isMyMessage
                  ? theme.colors.background
                  : theme.colors.text.primary,
              },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              {
                color: item.isMyMessage
                  ? theme.colors.background + "80"
                  : theme.colors.text.secondary,
              },
            ]}
          >
            {new Date(item.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeLayout edges={["top", "bottom"]} style={styles.safeLayout}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ChatHeader nickname={"상대방 닉네임"} />

      {/* 아이템 요약 정보 (스크롤 시 고정) */}
      <View style={styles.itemSummaryContainer}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {roomItem?.title ?? "아이템 정보를 불러오는 중..."}
          </Text>
          <Text style={styles.itemPrice}>
            {roomItem
              ? roomItem.status === "COMPLETED"
                ? "교환 완료"
                : roomItem.status === "FAILED"
                  ? "교환 취소"
                  : roomItem.status === "DELETED"
                    ? "삭제된 아이템"
                    : "교환 진행 중"
              : ""}
          </Text>
        </View>
      </View>

      {/* 채팅 리스트 */}
      <View style={styles.chatList}>
        <FlatList
          inverted
          data={messagesState.data || []}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.sentAt}-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {messagesState.status === "loading"
                  ? "메시지를 불러오는 중..."
                  : "메시지가 없습니다. 대화를 시작해보세요!"}
              </Text>
            </View>
          }
        />
      </View>

      {/* 하단 입력 폼 */}
      <View style={styles.inputFormContainer}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="메시지 보내기"
          placeholderTextColor={theme.colors.text.tertiary}
          multiline={false}
          maxLength={500}
          editable={status === "CONNECTED" && !isRoomCompleted}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={
            !inputMessage.trim() || status !== "CONNECTED" || isRoomCompleted
          }
        >
          <Text
            style={[
              styles.sendIcon,
              (!inputMessage.trim() ||
                status !== "CONNECTED" ||
                isRoomCompleted) &&
                styles.sendIconDisabled,
            ]}
          >
            ➤
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeLayout>
  );
}

// 채팅 헤더 컴포넌트
function ChatHeader({ nickname }: { nickname: string }) {
  const router = useRouter();

  return (
    <View style={styles.chatHeader}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{nickname}</Text>
      <View style={styles.headerRightSpacer} />
    </View>
  );
}

// 정적 스타일 정의 (작업 지시서 기준)
const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    paddingTop: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
  backIcon: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.primary,
  },
  headerRightSpacer: {
    width: theme.spacing.lg,
  },
  sendIconDisabled: {
    opacity: 0.5,
  },
  // 채팅 헤더
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  // 아이템 요약 정보 (스크롤 시 고정)
  itemSummaryContainer: {
    flexDirection: "row",
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.medium,
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  itemTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  itemPrice: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  // 채팅 리스트
  chatList: {
    flex: 1,
  },
  // 채팅 말풍선
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.background,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4, // 꼬리가 우측 하단
    padding: theme.spacing.sm,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.border.light,
    color: theme.colors.text.primary,
    borderTopLeftRadius: 4, // 꼬리가 좌측 하단
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    padding: theme.spacing.sm,
  },
  messageText: {
    fontSize: theme.typography.size.md,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  // 시스템 메시지
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: theme.spacing.xs,
  },
  systemMessageBubble: {
    backgroundColor: theme.colors.border.medium,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  // 하단 입력 폼
  inputFormContainer: {
    flexDirection: "row",
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.border.light,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.size.md,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    padding: theme.spacing.xs,
  },
  sendIcon: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.primary,
  },
});
