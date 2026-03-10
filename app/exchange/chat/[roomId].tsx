import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { useAuth } from "@/src/hooks/useAuth";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { theme } from "@/src/styles/theme";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";

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

  const roomIdNumber = Number(roomId);

  // 상태 관리 (TODO: 메시지 입력 기능 구현 시 사용)

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
      const messages = response.data?.messages ?? [];

      const mapped: ChatMessage[] = messages.map((message) => ({
        id: message.id,
        roomId: roomIdNumber,
        senderId: message.senderId,
        senderName: message.sender?.nickname ?? message.senderNickName,
        content: message.content,
        timestamp: message.sentAt || message.createdAt,
        isMine: message.isMyMessage,
        type: "CHAT",
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
  const { client, connect, status: wsStatus } = useWebSocket();
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
          console.error("[ChatRoom] message parse error:", error);
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
        console.log("📱 [AppState] 앱이 활성화되었습니다.");
        void connect();

        // 백그라운드 중 누락된 메시지 REST 패칭
        queryClient.invalidateQueries({
          queryKey: ["chatMessages", roomIdNumber],
        });
      } else if (nextAppState === "background") {
        // 백그라운드 전환 시 STOMP 비활성화 (배터리 최적화)
        console.log("📱 [AppState] 앱이 백그라운드로 전환되었습니다.");
        // TODO: STOMP 비활성화 로직 구현
      }
    });

    return () => {
      subscription.remove();
    };
  }, [connect, queryClient, roomIdNumber]);

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
    onError: () => {
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    },
  });

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

          {/* Target 14: 채팅방 상태 제어 UI - 소유자/요청자 화면 분기 */}
          {exchangeItem.status === "REGISTERED" && (
            <View style={styles.statusButtons}>
              {exchangeItem.user.id === user?.userId ? (
                // 아이템 소유자(Seller) 화면
                <>
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
                    style={styles.statusButtonError}
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
    >
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
});
