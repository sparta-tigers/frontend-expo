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
    Alert,
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
  const { status, sendMessage } = useWebSocket();
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
        id: msg.id,
        directRoomId: msg.directRoomId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        sentAt: msg.sentAt,
        sender: msg.sender,
        senderNickName: msg.senderNickName,
        isMyMessage: msg.senderId === 1, // TODO: 실제 사용자 ID로 변경
      }));

      return formattedMessages;
    }

    throw new Error("메시지를 불러올 수 없습니다.");
  }, [id]);

  // 초기 데이터 로드
  useEffect(() => {
    loadMessages(fetchInitialMessages());
  }, [loadMessages, fetchInitialMessages]);

  // 메시지 전송
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !id || status !== "CONNECTED") return;

    try {
      const messageContent = inputMessage.trim();
      const myMessage: ChatMessage = {
        id: Date.now(),
        directRoomId: Number(id),
        senderId: 1, // TODO: 실제 사용자 ID로 변경
        content: messageContent,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        sender: {
          id: 1,
          nickname: "나", // TODO: 실제 사용자 닉네임으로 변경
        },
        senderNickName: "나", // TODO: 실제 사용자 닉네임으로 변경
        isMyMessage: true,
      };

      // 메시지 전송
      sendMessage(`/app/chat/${id}`, messageContent);

      // UI에 즉시 반영
      loadMessages(Promise.resolve([myMessage, ...(messagesState.data || [])]));
      setInputMessage("");
    } catch (error) {
      console.error("메시지 전송 에러:", error);
    }
  }, [inputMessage, id, status, sendMessage, messagesState.data, loadMessages]);

  // 채팅 중 교환 거절 처리
  const handleRejectExchange = useCallback(async () => {
    Alert.alert(
      "교환 거절",
      "정말로 교환을 거절하시겠습니까? 거절하면 채팅이 종료됩니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "거절",
          style: "destructive",
          onPress: async () => {
            try {
              // TODO: 실제 교환 요청 ID를 파라미터로 받아와야 함
              // 현재는 채팅방 ID만 있음, 교환 요청 ID가 필요
              Alert.alert("알림", "교환 거절 기능은 곧 구현됩니다.");

              // 임시 구현 (교환 요청 ID가 필요)
              /*
              const updateData: UpdateExchangeStatusDto = {
                status: ExchangeRequestStatus.REJECTED,
                message: "채팅 중 교환을 거절했습니다.",
              };

              const response = await exchangeUpdateStatusAPI(exchangeRequestId, updateData);

              if (response.resultType === "SUCCESS") {
                Alert.alert("거절 완료", "교환을 거절했습니다. 채팅을 종료합니다.");
                router.back();
              } else {
                Alert.alert("오류", "교환 거절에 실패했습니다.");
              }
              */
            } catch (error) {
              console.error("교환 거절 실패:", error);
              Alert.alert("오류", "네트워크 에러가 발생했습니다.");
            }
          },
        },
      ],
    );
  }, []);

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

      {/* 교환 거절 버튼 */}
      <View
        style={[
          styles.exchangeActionsContainer,
          { borderTopColor: colors.border },
        ]}
      >
        <Button
          onPress={handleRejectExchange}
          variant="outline"
          style={[styles.rejectButton, { borderColor: colors.destructive }]}
        >
          <Text
            style={[styles.rejectButtonText, { color: colors.destructive }]}
          >
            교환 거절
          </Text>
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
  exchangeActionsContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  rejectButton: {
    minWidth: 100,
    borderColor: "red",
  },
  rejectButtonText: {
    color: "red",
  },
});
