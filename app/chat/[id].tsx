import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { ChatMessage } from "@/src/features/chat/types";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { ApiResponse } from "@/src/shared/types/common";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

/**
 * 채팅방 상세 화면
 * 실시간 채팅이 가능한 동적 라우트 화면
 */
export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, sendMessage, client } = useWebSocket();
  const { colors } = useTheme();

  const [inputMessage, setInputMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

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
        id: msg.id || 0,
        directRoomId: Number(id),
        senderId: msg.senderId || 0,
        content: msg.message,
        createdAt: msg.sentAt,
        sentAt: msg.sentAt,
        sender: {
          id: msg.senderId || 0,
          nickname: msg.senderNickname,
        },
        senderNickName: msg.senderNickname,
        isMyMessage: false, // TODO: 현재 사용자 ID와 비교 필요
      }));

      return formattedMessages.reverse();
    } else {
      throw new Error(
        response.error?.message || "메시지를 불러오는데 실패했습니다",
      );
    }
  }, [id]);

  // WebSocket 구독 설정
  useEffect(() => {
    if (!client || !id || status !== "CONNECTED") return;

    const subscription = client.subscribe(
      `/topic/directRoom/${id}`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);

          // 수신된 메시지를 UI 형식으로 변환
          const newMessage: ChatMessage = {
            id: receivedMessage.id || Date.now(),
            directRoomId: Number(id),
            senderId: receivedMessage.senderId || 0,
            content: receivedMessage.message,
            createdAt: receivedMessage.sentAt || new Date().toISOString(),
            sentAt: receivedMessage.sentAt || new Date().toISOString(),
            sender: {
              id: receivedMessage.senderId || 0,
              nickname: receivedMessage.senderNickname,
            },
            senderNickName: receivedMessage.senderNickname,
            isMyMessage: false, // TODO: 현재 사용자 ID와 비교 필요
          };

          // 기존 메시지에 새 메시지 추가
          if (messagesState.data) {
            loadMessages(Promise.resolve([newMessage, ...messagesState.data]));
          }
        } catch (error) {
          console.error("메시지 파싱 에러:", error);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, id, status, messagesState.data, loadMessages]);

  // 컴포넌트 마운트 시 초기 메시지 로드
  useEffect(() => {
    if (id) {
      loadMessages(fetchInitialMessages());
    }
  }, [id, loadMessages, fetchInitialMessages]);

  // 메시지 전송
  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !id || status !== "CONNECTED") return;

    try {
      // WebSocket으로 메시지 전송
      sendMessage("/client/directRoom/send", {
        roomId: id,
        message: inputMessage.trim(),
        senderId: 1, // TODO: 현재 사용자 ID 가져오기
      });

      // 전송한 메시지를 즉시 UI에 추가 (내 메시지)
      const myMessage: ChatMessage = {
        id: Date.now(),
        directRoomId: Number(id),
        senderId: 1, // TODO: 현재 사용자 ID 가져오기
        content: inputMessage.trim(),
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        sender: {
          id: 1, // TODO: 현재 사용자 ID 가져오기
          nickname: "나", // TODO: 현재 사용자 닉네임 가져오기
        },
        senderNickName: "나", // TODO: 현재 사용자 닉네임 가져오기
        isMyMessage: true,
      };

      if (messagesState.data) {
        loadMessages(Promise.resolve([myMessage, ...messagesState.data]));
      }
      setInputMessage("");
    } catch (error) {
      console.error("메시지 전송 에러:", error);
    }
  }, [inputMessage, id, status, sendMessage, messagesState.data, loadMessages]);

  // 메시지 아이템 렌더링
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View
        style={[
          styles.messageContainer,
          item.isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isMyMessage ? styles.myMessageText : styles.otherMessageText,
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            item.isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
          ]}
        >
          {new Date(item.sentAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    ),
    [],
  );

  // 연결 상태 표시
  const getConnectionStatusText = () => {
    switch (status) {
      case "CONNECTING":
        return "🟡 연결 중...";
      case "CONNECTED":
        return "🟢 연결됨";
      case "DISCONNECTED":
        return "🔴 연결 끊김";
      case "ERROR":
        return "🔴 연결 오류";
      default:
        return "🔴 연결 끊김";
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Button onPress={() => router.back()} variant="ghost" size="sm">
          ←
        </Button>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          채팅방 #{id}
        </Text>
        <Text style={[styles.connectionStatus, { color: colors.muted }]}>
          {getConnectionStatusText()}
        </Text>
      </View>

      {/* 에러 상태 */}
      {messagesState.status === "error" && (
        <View
          style={[styles.errorContainer, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.errorText, { color: colors.text }]}>
            {messagesState.error}
          </Text>
        </View>
      )}

      {/* 메시지 목록 */}
      <FlatList
        ref={flatListRef}
        data={messagesState.data || []}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.sentAt}-${index}`}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        inverted={true}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {messagesState.status === "loading"
                ? "메시지를 불러오는 중..."
                : "메시지가 없습니다"}
            </Text>
          </View>
        }
      />

      {/* 입력창 */}
      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={500}
          editable={status === "CONNECTED"}
        />
        <Button
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || status !== "CONNECTED"}
          size="sm"
          style={[
            styles.sendButton,
            (!inputMessage.trim() || status !== "CONNECTED") &&
              styles.sendButtonDisabled,
          ]}
        >
          전송
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  connectionStatus: {
    fontSize: 12,
  },
  errorContainer: {
    padding: 12,
  },
  errorText: {
    textAlign: "center",
    fontSize: 14,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageText: {
    fontSize: 16,
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  myMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "white",
  },
  messageTime: {
    fontSize: 12,
    marginHorizontal: 12,
  },
  myMessageTime: {
    textAlign: "right",
  },
  otherMessageTime: {
    textAlign: "left",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    minWidth: 60,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
