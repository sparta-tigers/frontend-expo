import { SafeLayout } from "@/components/ui/safe-layout";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { ChatMessage } from "@/src/features/chat/types";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useAsyncState } from "@/src/shared/hooks/useAsyncState";
import { ApiResponse } from "@/src/shared/types/common";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

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
  const { status, sendMessage } = useWebSocket();

  const [inputMessage, setInputMessage] = useState("");

  // Mock 아이템 데이터 (실제로는 채팅방 정보에서 가져와야 함)
  const mockItem = {
    title: "야구 경기 티켓",
    price: null, // 교환의 경우 가격 없음
    thumb: "https://via.placeholder.com/48x48/cccccc/666666?text=ITEM",
  };

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
              { color: item.isMyMessage ? "#FFFFFF" : "#111827" },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: item.isMyMessage ? "#FFFFFF80" : "#6B7280" },
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
    <SafeLayout
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <ChatHeader nickname={"상대방 닉네임"} />

      {/* 아이템 요약 정보 (스크롤 시 고정) */}
      <View style={styles.itemSummaryContainer}>
        <Image source={{ uri: mockItem.thumb }} style={styles.itemThumbnail} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{mockItem.title}</Text>
          <Text style={styles.itemPrice}>
            {mockItem.price ? `${mockItem.price}원` : "교환"}
          </Text>
        </View>
        <TouchableOpacity style={styles.statusButton}>
          <Text style={styles.statusButtonText}>교환 확정</Text>
        </TouchableOpacity>
      </View>

      {/* 채팅 리스트 */}
      <View style={styles.chatList}>
        <FlatList
          inverted
          data={messagesState.data || []}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.sentAt}-${index}`}
          contentContainerStyle={{ paddingTop: 16 }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 40,
              }}
            >
              <Text style={{ fontSize: 16, color: "#6B7280" }}>
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
          placeholderTextColor="#9CA3AF"
          multiline={false}
          maxLength={500}
          editable={status === "CONNECTED"}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || status !== "CONNECTED"}
        >
          <Text
            style={[
              styles.sendIcon,
              (!inputMessage.trim() || status !== "CONNECTED") && {
                opacity: 0.5,
              },
            ]}
          >
            ➤
          </Text>
        </TouchableOpacity>
      </View>
    </SafeLayout>
  );
}

// 채팅 헤더 컴포넌트
function ChatHeader({ nickname }: { nickname: string }) {
  const router = useRouter();

  return (
    <View style={styles.chatHeader}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ fontSize: 20, color: "#000000" }}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{nickname}</Text>
      <View style={{ width: 20 }} />
    </View>
  );
}

// 정적 스타일 정의 (작업 지시서 기준)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 채팅 헤더
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 12,
  },
  // 아이템 요약 정보 (스크롤 시 고정)
  itemSummaryContainer: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  itemThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  itemPrice: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  statusButton: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
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
    backgroundColor: "#000000",
    color: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4, // 꼬리가 우측 하단
    padding: 12,
  },
  otherMessageBubble: {
    backgroundColor: "#F3F4F6",
    color: "#111827",
    borderTopLeftRadius: 4, // 꼬리가 좌측 하단
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  // 시스템 메시지
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessageBubble: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  // 하단 입력 폼
  inputFormContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    padding: 8,
  },
  sendIcon: {
    fontSize: 24,
    color: "#000000",
  },
});
