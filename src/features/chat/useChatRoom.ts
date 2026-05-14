// app/exchange/chat/[roomId]/useChatRoom.ts
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState } from "react-native";

import { apiClient } from "@/src/core/client";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { itemsUpdateStatusAPI } from "@/src/features/exchange/api";
import { useAuth } from "@/src/hooks/useAuth";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { ApiResponse } from "@/src/shared/types/common";
import { Logger } from "@/src/utils/logger";

/**
 * ChatMessage
 *
 * Why: id가 음수(negative)인 경우 낙관적 업데이트용 임시 메시지를 의미.
 *      isMine 판정은 현재 로그인 userId와 senderId 비교로 결정됨.
 */
export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  type?: "CHAT" | "SYSTEM";
}

/**
 * ChatMessagesPage
 *
 * Why: 무한 스크롤 페이지 단위 캐싱을 위해 content 배열과 함께
 *      hasNext 플래그(API의 last 역산)를 묶은 단위.
 */
interface ChatMessagesPage {
  content: ChatMessage[];
  hasNext: boolean;
}

/**
 * ExchangeItem
 *
 * Why: 채팅방과 연결된 중고 거래/교환 아이템의 정보를 담는 DTO.
 *      상태(status, exchangeStatus)에 따라 채팅 입력창 활성화 여부가 결정됨.
 */
export interface ExchangeItem {
  itemId: number;
  title: string;
  description: string;
  category: "TICKET" | "GOODS";
  status: "REGISTERED" | "COMPLETED" | "FAILED" | "DELETED";
  ownerId: number;
  ownerNickname: string;
  exchangeStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
}

/**
 * UseChatRoomReturn
 *
 * Why: useChatRoom 훅의 반환 타입 정의. UI에서 필요한 모든 상태와 핸들러를 포함.
 */
interface UseChatRoomReturn {
  exchangeItem: ExchangeItem | undefined;
  itemLoading: boolean;
  flattenedMessages: ChatMessage[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isConnected: boolean;
  isInputDisabled: boolean;
  messageText: string;
  setMessageText: (v: string) => void;
  handleSendMessage: () => void;
  handleStatusChange: (status: "COMPLETE" | "CANCEL") => void;
  isRoomIdInvalid: boolean;
}

/**
 * useChatRoom
 *
 * Why: ChatRoomScreen의 모든 비즈니스 로직(TanStack Query, STOMP, 낙관적 업데이트)을 UI로부터 분리.
 * React 상태 중 messageText/setMessageText만 이 훅이 소유 - 컴포넌트는 값만 렌더링.
 */
export function useChatRoom(
  roomId: string,
): UseChatRoomReturn {
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const roomIdNumber = Number(roomId);
  const isRoomIdInvalid =
    !roomId ||
    roomId === "undefined" ||
    roomId === "null" ||
    !Number.isFinite(roomIdNumber) ||
    roomIdNumber <= 0;

  // 아이템 조회
  const { data: exchangeItem, isLoading: itemLoading } = useQuery({
    queryKey: ["exchangeItem", roomIdNumber],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ExchangeItem>>(
        `/api/direct-rooms/${roomIdNumber}/item`,
      );
      return response.data as ExchangeItem;
    },
    enabled: !isRoomIdInvalid,
  });

  const isInputDisabled = useMemo(() => {
    return (
      exchangeItem?.status === "COMPLETED" ||
      exchangeItem?.status === "DELETED" ||
      exchangeItem?.exchangeStatus === "PENDING" ||
      exchangeItem?.exchangeStatus === "REJECTED"
    );
  }, [exchangeItem?.status, exchangeItem?.exchangeStatus]);

  // 메시지 페이지네이션 조회
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
      return { content: mapped, hasNext: !(response.data?.last ?? true) };
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

  // WebSocket
  const { client, connect, status: wsStatus } = useWebSocket(
    isRoomIdInvalid ? "" : roomId,
    "directroom",
  );
  const isConnected = wsStatus === "CONNECTED";

  // 메시지 수신 → QueryClient 업데이트
  const handleMessageReceived = useCallback(
    (newMessage: ChatMessage) => {
      queryClient.setQueryData(
        ["chatMessages", roomIdNumber],
        (oldData: InfiniteData<ChatMessagesPage, number> | undefined) => {
          if (!oldData || oldData.pages.length === 0) {
            return {
              pages: [{ content: [newMessage], hasNext: false }],
              pageParams: [0],
            };
          }
          const prevContent = oldData.pages[0].content;
          const cleanList = prevContent.filter(
            (msg) =>
              !(
                msg.id < 0 &&
                msg.senderId === newMessage.senderId &&
                msg.content === newMessage.content
              ),
          );
          if (cleanList.some((msg) => msg.id === newMessage.id)) return oldData;
          const nextPages = [...oldData.pages];
          nextPages[0] = { ...nextPages[0], content: [newMessage, ...cleanList] };
          return { ...oldData, pages: nextPages };
        },
      );
    },
    [queryClient, roomIdNumber],
  );

  // 메시지 전송 + optimistic update
  const handleSendMessage = useCallback(() => {
    if (!client || !isConnected) {
      Alert.alert("연결 오류", "서버와 연결이 불안정합니다. 잠시 후 다시 시도해주세요.");
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

    const prevText = messageText;
    handleMessageReceived(optimistic);
    setMessageText("");

    try {
      client.publish({
        destination: "/client/directRoom/send",
        body: JSON.stringify({ roomId: roomIdNumber, message: optimistic.content }),
      });
    } catch (error) {
      Logger.error(
        "[ChatRoom] send message error:",
        error instanceof Error ? error.message : String(error),
      );
      // Why: 전송 실패 시 tempId(negative id) 기준으로 낙관적 업데이트 롤백
      queryClient.setQueryData(
        ["chatMessages", roomIdNumber],
        (oldData: InfiniteData<ChatMessagesPage, number> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              content: page.content.filter((msg) => msg.id !== optimistic.id),
            })),
          };
        },
      );
      // Why: 사용자가 다시 타이핑하지 않도록 입력값 복원
      setMessageText(prevText);
      Alert.alert("전송 실패", "메시지 전송에 실패했습니다.");
    }
  }, [client, handleMessageReceived, isConnected, messageText, queryClient, roomIdNumber, user, setMessageText]);

  // STOMP 구독
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
            // Why: STOMP로 거래 상태 업데이트(ex. COMPLETE) 신호를 받으면,
            //      현재 방의 교환 아이템 캐시뿐 아니라 전역 아이템 목록들도 무효화하여
            //      다른 화면(대시보드, 교환 탭 등)에서 과거 상태가 보이지 않도록 동기화한다.
            void (async () => {
              try {
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ["exchangeItem", roomIdNumber], exact: true }),
                  queryClient.invalidateQueries({ queryKey: ["items"] }),
                  user?.userId 
                    ? queryClient.invalidateQueries({ queryKey: ["myItems", user.userId], exact: true })
                    : Promise.resolve(),
                  queryClient.invalidateQueries({ queryKey: ["myExchanges"] }),
                ]);
              } catch (error) {
                Logger.error("[ChatRoom] cache invalidation failed:", error);
              }
            })();
            return;
          }

          const normalized: ChatMessage = {
            id: parsed.messageId ?? parsed.id ?? Date.now(),
            roomId: roomIdNumber,
            senderId: parsed.senderId,
            senderName: parsed.senderNickname ?? parsed.senderName ?? "",
            content: parsed.message ?? parsed.content ?? "",
            timestamp:
              parsed.sentAt ?? parsed.timestamp ?? parsed.createdAt ?? new Date().toISOString(),
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
  }, [client, handleMessageReceived, isConnected, queryClient, roomIdNumber, user?.userId]);

  // AppState 변경 시 재연결
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        void connect();
      } else if (nextAppState === "background") {
        void client?.deactivate();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [client, connect]);

  // 교환 상태 변경
  const { mutate: updateItemStatus } = useMutation({
    mutationFn: async (newStatus: "COMPLETE" | "CANCEL") => {
      if (!exchangeItem?.itemId) throw new Error("itemId missing");
      const response = await itemsUpdateStatusAPI(exchangeItem.itemId, newStatus);
      if (response.resultType !== "SUCCESS") throw new Error("status update failed");
      return true;
    },
    onSuccess: async () => {
      Alert.alert("성공", "상태가 변경되었습니다.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exchangeItem", roomIdNumber], exact: true }),
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        user?.userId 
          ? queryClient.invalidateQueries({ queryKey: ["myItems", user.userId], exact: true })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ["myExchanges"] }),
      ]);
    },
    onError: () => Alert.alert("오류", "상태 변경에 실패했습니다."),
  });

  const handleStatusChange = useCallback(
    (newStatus: "COMPLETE" | "CANCEL") => {
      Alert.alert(
        "확인",
        newStatus === "COMPLETE" ? "교환을 확정하시겠습니까?" : "교환을 취소하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "확인", onPress: () => updateItemStatus(newStatus) },
        ],
      );
    },
    [updateItemStatus],
  );

  return {
    exchangeItem,
    itemLoading,
    flattenedMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isConnected,
    isInputDisabled,
    messageText,
    setMessageText,
    handleSendMessage,
    handleStatusChange,
    isRoomIdInvalid,
  };
}
