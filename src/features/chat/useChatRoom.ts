// src/features/chat/useChatRoom.ts
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState } from "react-native";

import { apiClient } from "@/src/core/client";
import { chatroomsGetMessagesAPI } from "@/src/features/chat/api";
import { useAuth } from "@/src/hooks/useAuth";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { ApiResponse } from "@/src/shared/types/common";
import { Logger } from "@/src/utils/logger";

/**
 * ChatMessage / ChatMessagesPage 타입 정의 (생략 없음)
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

interface ChatMessagesPage {
  content: ChatMessage[];
  hasNext: boolean;
}

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
 * 🛠️ ChatRoomOptions
 * Why: 도메인 결합을 끊기 위한 의존성 주입 인터페이스.
 */
export interface ChatRoomOptions {
  /** 거래 상태 변경(완료/취소) 시 호출될 콜백 */
  onStatusChange?: (status: "COMPLETE" | "CANCEL", itemId: number) => Promise<void>;
}

interface UseChatRoomReturn {
  exchangeItem: ExchangeItem | undefined;
  itemLoading: boolean;
  flattenedMessages: ChatMessage[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isConnected: boolean;
  isInputDisabled: boolean;
  isProcessing: boolean; // 🚨 추가: 비동기 작업 진행 여부
  messageText: string;
  setMessageText: (v: string) => void;
  handleSendMessage: () => void;
  handleStatusChange: (status: "COMPLETE" | "CANCEL") => void;
  isRoomIdInvalid: boolean;
}

/**
 * useChatRoom
 * 
 * Why: 특정 피처(Exchange)에 종속되지 않는 순수 채팅 비즈니스 로직.
 * 비동기 액션은 콜백 주입을 통해 처리하며, 내부에서 Race Condition을 방어함.
 */
export function useChatRoom(
  roomId: string,
  options?: ChatRoomOptions,
): UseChatRoomReturn {
  const [messageText, setMessageText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // 🛡️ Race Condition 방어용 플래그
  const queryClient = useQueryClient();
  const { user, isLoggedIn } = useAuth();

  const roomIdNumber = Number(roomId);
  const isRoomIdInvalid =
    !roomId ||
    roomId === "undefined" ||
    roomId === "null" ||
    !Number.isFinite(roomIdNumber) ||
    roomIdNumber <= 0;

  // 아이템 조회 (채팅방 컨텍스트용)
  const { data: exchangeItem, isLoading: itemLoading } = useQuery({
    queryKey: ["exchangeItem", roomIdNumber],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ExchangeItem>>(
        `/api/direct-rooms/${roomIdNumber}/item`,
      );
      return response.data as ExchangeItem;
    },
    enabled: isLoggedIn && !isRoomIdInvalid,
  });

  const isInputDisabled = useMemo(() => {
    return (
      exchangeItem?.status === "COMPLETED" ||
      exchangeItem?.status === "DELETED" ||
      exchangeItem?.exchangeStatus === "PENDING" ||
      exchangeItem?.exchangeStatus === "REJECTED"
    );
  }, [exchangeItem?.status, exchangeItem?.exchangeStatus]);

  // 메시지 페이지네이션 조회 (기존 로직 유지)
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ChatMessagesPage>({
    queryKey: ["chatMessages", roomIdNumber],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await chatroomsGetMessagesAPI(roomIdNumber, pageParam as number);
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
    getNextPageParam: (lastPage, allPages) => lastPage.hasNext ? allPages.length : undefined,
    enabled: isLoggedIn && !isRoomIdInvalid,
    initialPageParam: 0,
  });

  const flattenedMessages = useMemo(() => {
    const pages = messagesData?.pages ?? [];
    return pages.flatMap((page) => page.content);
  }, [messagesData]);

  // WebSocket / STOMP 로직 (기존 로직 유지)
  const { client, connect, status: wsStatus } = useWebSocket(
    isRoomIdInvalid ? "" : roomId,
    "directroom",
  );
  const isConnected = wsStatus === "CONNECTED";

  const handleMessageReceived = useCallback(
    (newMessage: ChatMessage) => {
      queryClient.setQueryData(
        ["chatMessages", roomIdNumber],
        (oldData: InfiniteData<ChatMessagesPage, number> | undefined) => {
          if (!oldData || oldData.pages.length === 0) {
            return { pages: [{ content: [newMessage], hasNext: false }], pageParams: [0] };
          }
          const prevContent = oldData.pages[0].content;
          // 🛡️ 중복 제거 로직 강화: 
          // 1. 낙관적 메시지(음수 ID)끼리의 중복 제거
          // 2. 서버 에코 수신 시, 동일 내용/작성자의 낙관적 메시지 교체
          const cleanList = prevContent.filter((msg) => {
            // 동일한 낙관적 ID 제거
            if (msg.id < 0 && msg.id === newMessage.id) return false;
            
            // 서버 확정 메시지(양수) 수신 시, 매칭되는 내 낙관적 메시지 제거
            if (
              msg.id < 0 && 
              newMessage.id > 0 && 
              msg.isMine && 
              newMessage.isMine &&
              msg.content === newMessage.content
            ) {
              return false;
            }
            return true;
          });
          
          if (cleanList.some((msg) => msg.id === newMessage.id)) return oldData;
          const nextPages = [...oldData.pages];
          nextPages[0] = { ...nextPages[0], content: [newMessage, ...cleanList] };
          return { ...oldData, pages: nextPages };
        },
      );
    },
    [queryClient, roomIdNumber],
  );

  const handleSendMessage = useCallback(() => {
    if (!client || !isConnected) {
      Alert.alert("연결 오류", "서버와 연결이 불안정합니다.");
      return;
    }
    if (!user?.userId || !messageText.trim()) return;

    const optimistic: ChatMessage = {
      id: -Date.now(),
      roomId: roomIdNumber,
      senderId: user.userId,
      senderName: user.nickname ?? "",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
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
    } catch {
      queryClient.setQueryData(
        ["chatMessages", roomIdNumber],
        (oldData: InfiniteData<ChatMessagesPage, number> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((p) => ({
              ...p,
              content: p.content.filter((m) => m.id !== optimistic.id),
            })),
          };
        },
      );
      setMessageText(prevText);
      Alert.alert("전송 실패", "메시지 전송에 실패했습니다.");
    }
  }, [client, handleMessageReceived, isConnected, messageText, queryClient, roomIdNumber, user]);

  // STOMP 구독 및 AppState 관리 (기존 로직 유지)
  useEffect(() => {
    if (!client || !isConnected || isRoomIdInvalid) return;
    const subscription = client.subscribe(`/server/directRoom/${roomIdNumber}`, (msg) => {
      try {
        const parsed = JSON.parse(msg.body);
        if (parsed.type === "SYSTEM" && parsed.action === "STATUS_UPDATED") {
          // Why: 거래 상태 업데이트 시 관련 캐시 전역 무효화 (상대방 변경 시에도 내 목록 반영)
          queryClient.invalidateQueries({ queryKey: ["exchangeItem", roomIdNumber], exact: true }).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ["items"] }).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ["myExchanges"] }).catch(() => {});
          if (user?.userId) {
            queryClient.invalidateQueries({ queryKey: ["myItems", user.userId] }).catch(() => {});
          }
          return;
        }
        const normalized: ChatMessage = {
          id: parsed.messageId ?? parsed.id ?? Date.now(),
          roomId: roomIdNumber,
          senderId: parsed.senderId,
          senderName: parsed.senderNickname ?? parsed.senderName ?? "",
          content: parsed.message ?? parsed.content ?? "",
          timestamp: parsed.sentAt ?? parsed.timestamp ?? parsed.createdAt ?? new Date().toISOString(),
          isMine: parsed.senderId === (user?.userId ?? -1),
          type: parsed.type ?? "CHAT",
        };
        handleMessageReceived(normalized);
      } catch (e) { Logger.error("[ChatRoom] parse error", e); }
    });
    return () => subscription.unsubscribe();
  }, [client, handleMessageReceived, isConnected, queryClient, roomIdNumber, user?.userId, isRoomIdInvalid]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") connect().catch(() => {});
      else if (s === "background") {
        client?.deactivate().catch((err) => Logger.error("[ChatRoom] Deactivate failed", err));
      }
    });
    return () => sub.remove();
  }, [client, connect]);

  /**
   * 🎯 handleStatusChange (Refactored)
   * Why: 비동기 주입 콜백을 안전하게 실행하며 중복 클릭을 방지함.
   */
  const handleStatusChange = useCallback(
    async (newStatus: "COMPLETE" | "CANCEL") => {
      if (isProcessing) return; // 🛡️ 이미 처리 중이면 차단 (Race Condition 방어)
      if (!exchangeItem?.itemId) return;

      Alert.alert(
        "확인",
        newStatus === "COMPLETE" ? "교환을 확정하시겠습니까?" : "교환을 취소하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          {
            text: "확인",
            onPress: async () => {
              setIsProcessing(true); // 🚀 로딩 시작
              try {
                // 🔗 외부 주입 콜백 실행 (Zero Magic: 훅은 내부 로직을 모름)
                if (options?.onStatusChange) {
                  await options.onStatusChange(newStatus, exchangeItem.itemId);
                }
              } catch (error) {
                Logger.error("[ChatRoom] Status change failed:", error);
                // 🚨 Fail-fast: 사용자에게 명확한 피드백 유지
                Alert.alert("오류", "거래 상태 변경 중 문제가 발생했습니다.");
              } finally {
                setIsProcessing(false); // ✅ 로딩 종료
              }
            },
          },
        ],
      );
    },
    [exchangeItem?.itemId, isProcessing, options],
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
    isProcessing,
    messageText,
    setMessageText,
    handleSendMessage,
    handleStatusChange,
    isRoomIdInvalid,
  };
}
