import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { chatroomsGetMessagesAPI } from "@/src/api/chatrooms";
import { ChatMessage, ChatMessageData } from "@/src/api/types/chatrooms";
import { ApiResponse, ResultType } from "@/src/api/index";

/**
 * 채팅방 상세 화면
 * 실시간 채팅이 가능한 동적 라우트 화면
 */
export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, sendMessage, client } = useWebSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // 초기 메시지 로드
  const loadInitialMessages = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response: ApiResponse<any> = await chatroomsGetMessagesAPI(
        Number(id),
        0,
        50,
      );

      if (response.resultType === ResultType.SUCCESS && response.data) {
        const messageData: ChatMessageData[] = response.data.content || [];

        // 서버 데이터를 UI 데이터로 변환
        const formattedMessages: ChatMessage[] = messageData.map((msg) => ({
          content: msg.message,
          sentAt: msg.sentAt,
          senderNickName: msg.senderNickname,
          isMyMessage: false, // TODO: 현재 사용자 ID와 비교 필요
        }));

        setMessages(formattedMessages.reverse());
      } else {
        setError(response.error?.message || "메시지를 불러오는데 실패했습니다");
      }
    } catch (err) {
      console.error("메시지 로드 에러:", err);
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // WebSocket 구독 설정
  useEffect(() => {
    if (!client || !id || status !== "CONNECTED") return;

    const subscription = client.subscribe(`/sub/chat/room/${id}`, (message) => {
      try {
        const receivedMessage = JSON.parse(message.body);

        // 수신된 메시지를 UI 형식으로 변환
        const newMessage: ChatMessage = {
          content: receivedMessage.message,
          sentAt: receivedMessage.sentAt || new Date().toISOString(),
          senderNickName: receivedMessage.senderNickname,
          isMyMessage: false, // TODO: 현재 사용자 ID와 비교 필요
        };

        setMessages((prev) => [newMessage, ...prev]);
      } catch (error) {
        console.error("메시지 파싱 에러:", error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, id, status]);

  // 컴포넌트 마운트 시 초기 메시지 로드
  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // 메시지 전송
  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !id || status !== "CONNECTED") return;

    try {
      // WebSocket으로 메시지 전송
      sendMessage("/pub/chat/send", {
        roomId: id,
        message: inputMessage.trim(),
        senderId: 1, // TODO: 현재 사용자 ID 가져오기
      });

      // 전송한 메시지를 즉시 UI에 추가 (내 메시지)
      const myMessage: ChatMessage = {
        content: inputMessage.trim(),
        sentAt: new Date().toISOString(),
        senderNickName: "나", // TODO: 현재 사용자 닉네임 가져오기
        isMyMessage: true,
      };

      setMessages((prev) => [myMessage, ...prev]);
      setInputMessage("");
    } catch (error) {
      console.error("메시지 전송 에러:", error);
      setError("메시지 전송에 실패했습니다");
    }
  }, [inputMessage, id, status, sendMessage]);

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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>채팅방 #{id}</Text>
        <Text style={styles.connectionStatus}>{getConnectionStatusText()}</Text>
      </View>

      {/* 에러 상태 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 메시지 목록 */}
      <FlatList
        ref={flatListRef}
        data={messages}
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
            <Text style={styles.emptyText}>
              {isLoading ? "메시지를 불러오는 중..." : "메시지가 없습니다"}
            </Text>
          </View>
        }
      />

      {/* 입력창 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="메시지를 입력하세요..."
          multiline
          maxLength={500}
          editable={status === "CONNECTED"}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputMessage.trim() || status !== "CONNECTED") &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || status !== "CONNECTED"}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    fontSize: 24,
    marginRight: 12,
    color: "#007AFF",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  connectionStatus: {
    fontSize: 12,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#FF3B30",
    padding: 12,
  },
  errorText: {
    color: "white",
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
    backgroundColor: "#007AFF",
    color: "white",
  },
  otherMessageText: {
    backgroundColor: "white",
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    color: "#999",
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
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
