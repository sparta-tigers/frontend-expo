import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/constants/unified-design";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/src/hooks/useAuth";
import { useWebSocket } from "@/src/hooks/useWebSocket";

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
}

interface ExchangeItem {
  id: number;
  title: string;
  description: string;
  category: "TICKET" | "GOODS";
  status: "REGISTERED" | "EXCHANGE_COMPLETED" | "EXCHANGE_FAILED";
  user: {
    id: number;
    nickname: string;
  };
}

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors } = useTheme();
  const flatListRef = useRef<any>(null);

  // 상태 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

  // 🚨 앙드레 카파시: 아이템 정보 조회 (도메인 상태 결합)
  const { data: exchangeItem, isLoading: itemLoading } = useQuery({
    queryKey: ["exchangeItem", roomId],
    queryFn: async () => {
      // TODO: 채팅방 관련 아이템 정보 API 호출
      /*
      const response = await exchangeGetItemByRoomIdAPI(Number(roomId));
      return response.data;
      */

      // Mock 데이터 (실제 API 연동 전)
      return {
        id: 123,
        title: "경기 티켓 교환",
        description: "A석 1열 좋은 자리입니다",
        category: "TICKET" as const,
        status: "REGISTERED" as const,
        user: {
          id: 456,
          nickname: "상대방",
        },
      } as ExchangeItem;
    },
    enabled: !!roomId,
  });

  // 🚨 앙드레 카파시: 과거 메시지 조회
  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["chatMessages", roomId],
    queryFn: async () => {
      // TODO: 과거 메시지 API 호출
      /*
      const response = await chatGetMessagesAPI(Number(roomId));
      return response.data;
      */

      // Mock 데이터 (실제 API 연동 전)
      const mockMessages = [
        {
          id: 1,
          roomId: Number(roomId),
          senderId: user?.userId || 0,
          senderName: user?.nickname || "나",
          content: "안녕하세요! 교환 신청했습니다.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isMine: true,
        },
        {
          id: 2,
          roomId: Number(roomId),
          senderId: 789,
          senderName: "상대방",
          content: "네, 확인했습니다. 언제 교환 가능하신가요?",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isMine: false,
        },
      ] as ChatMessage[];

      setMessages(mockMessages);
      return mockMessages;
    },
    enabled: !!roomId,
  });

  // 🚨 앙드레 카파시: STOMP WebSocket 연결
  const {
    status: wsStatus,
    client: stompClient,
    sendMessage: publish,
  } = useWebSocket();
  const isConnected = wsStatus === "CONNECTED";

  // 🚨 앙드레 카파시: AppState 이벤트 리스너 (백그라운드/포그라운드 전환 감지)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // 포그라운드 복귀 시 STOMP 재연결
        console.log("📱 [AppState] 앱이 활성화되었습니다.");

        if (stompClient && !stompClient.connected) {
          // TODO: 재연결 로직 구현
        }

        // 백그라운드 중 누락된 메시지 REST 패칭
        queryClient.invalidateQueries({ queryKey: ["chatMessages", roomId] });
      } else if (nextAppState === "background") {
        // 백그라운드 전환 시 STOMP 비활성화 (배터리 최적화)
        console.log("📱 [AppState] 앱이 백그라운드로 전환되었습니다.");

        if (stompClient && stompClient.connected) {
          // TODO: 비활성화 로직 구현
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [roomId, stompClient, queryClient]);

  // 🚨 앙드레 카파시: 상태 변경 Mutation
  const { mutate: updateItemStatus } = useMutation({
    mutationFn: async () => {
      // TODO: 아이템 상태 변경 API 호출
      /*
      const response = await itemsUpdateStatusAPI(exchangeItem?.id, newStatus);
      return response.data;
      */

      // Mock 응답 (실제 API 연동 전)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
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
    onError: (error) => {
      Alert.alert("오류", "상태 변경에 실패했습니다.");
      console.error("상태 변경 실패:", error);
    },
  });

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || !isConnected) return;

    const messageData = {
      roomId: Number(roomId),
      content: inputText.trim(),
      senderId: user?.userId,
      senderName: user?.nickname,
    };

    publish(`/pub/chat/${roomId}`, messageData);
    setInputText("");
  }, [inputText, isConnected, roomId, user, publish]);

  // 상태 변경 버튼 핸들러
  const handleStatusChange = useCallback(
    (newStatus: "EXCHANGE_COMPLETED" | "EXCHANGE_FAILED") => {
      Alert.alert(
        "확인",
        newStatus === "EXCHANGE_COMPLETED"
          ? "교환을 확정하시겠습니까?"
          : "교환을 취소하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "확인", onPress: () => updateItemStatus() },
        ],
      );
    },
    [updateItemStatus],
  );

  // 메시지 렌더링 컴포넌트
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View
        style={[
          styles.messageContainer,
          {
            backgroundColor: item.isMine ? colors.primary : colors.surface,
            alignSelf: item.isMine ? "flex-end" : "flex-start",
          },
        ]}
      >
        <Text
          style={[
            styles.senderName,
            { color: item.isMine ? colors.background : colors.text },
          ]}
        >
          {item.senderName}
        </Text>
        <Text
          style={[
            styles.messageContent,
            { color: item.isMine ? colors.background : colors.text },
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            { color: item.isMine ? colors.background : colors.muted },
          ]}
        >
          {new Date(item.timestamp).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    ),
    [colors],
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
              : exchangeItem.status === "EXCHANGE_COMPLETED"
                ? "교환 완료"
                : "교환 취소"}
          </Text>

          {/* 🚨 앙드레 카파시: 상태 변경 버튼 */}
          {exchangeItem.status === "REGISTERED" && (
            <View style={styles.statusButtons}>
              <Button
                onPress={() => handleStatusChange("EXCHANGE_COMPLETED")}
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
                  교환 확정
                </Text>
              </Button>
              <Button
                onPress={() => handleStatusChange("EXCHANGE_FAILED")}
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: "#EF4444",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    { color: colors.background },
                  ]}
                >
                  교환 취소
                </Text>
              </Button>
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
    >
      {/* 아이템 정보 헤더 */}
      {renderExchangeItemHeader()}

      {/* 🚨 앙드레 카파시: FlashList Inverted 렌더링 */}
      <FlashList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        inverted={true} // 최신 메시지가 아래에 고정되도록 강제}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {messagesLoading
                ? "메시지를 불러오는 중..."
                : "아직 메시지가 없습니다"}
            </Text>
          </View>
        }
      />

      {/* 메시지 입력창 */}
      <View
        style={[styles.inputContainer, { backgroundColor: colors.surface }]}
      >
        <Input
          placeholder="메시지를 입력하세요"
          value={inputText}
          onChangeText={setInputText}
          multiline
          style={styles.messageInput}
        />
        <Button
          onPress={handleSendMessage}
          disabled={!inputText.trim() || !isConnected}
          style={[
            styles.sendButton,
            {
              backgroundColor:
                !inputText.trim() || !isConnected
                  ? colors.muted
                  : colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.sendButtonText,
              {
                color:
                  !inputText.trim() || !isConnected
                    ? colors.background
                    : colors.background,
              },
            ]}
          >
            전송
          </Text>
        </Button>
      </View>

      {/* 연결 상태 표시 */}
      <View
        style={[
          styles.connectionStatus,
          {
            backgroundColor: isConnected
              ? colors.success || "#10B981"
              : "#EF4444",
          },
        ]}
      >
        <Text
          style={[styles.connectionStatusText, { color: colors.background }]}
        >
          {isConnected ? "연결됨" : "연결 끊김"}
        </Text>
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
    borderBottomColor: "#e0e0e0",
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
  statusButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
  },
  messagesList: {
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
  },
  messageContainer: {
    maxWidth: "70%",
    padding: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.CARD,
    marginBottom: SPACING.SMALL,
  },
  senderName: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.TINY,
  },
  messageContent: {
    fontSize: FONT_SIZE.BODY,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: FONT_SIZE.CAPTION,
    marginTop: SPACING.TINY,
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
  inputContainer: {
    flexDirection: "row",
    padding: SPACING.COMPONENT,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
    gap: SPACING.SMALL,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  sendButtonText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "600",
  },
  connectionStatus: {
    paddingVertical: SPACING.TINY,
    alignItems: "center",
  },
  connectionStatusText: {
    fontSize: FONT_SIZE.CAPTION,
    fontWeight: "600",
  },
});
