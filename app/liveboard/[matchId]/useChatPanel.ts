// app/liveboard/[matchId]/useChatPanel.ts
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView } from "react-native";

/**
 * 라이브보드 채팅 버블 메시지 (UI 렌더링용)
 */
export interface ChatBubbleMessage {
  /** 중복 방지 키 (optimistic: `local-{timestamp}`, 서버 수신: `senderId-sentAt-content`) */
  key: string;
  senderId: number | null;
  author: string;
  text: string;
  time: string; // HH:mm
  mine: boolean;
}

/**
 * 서버 STOMP 수신 메시지 DTO (ChatMessage.java와 매칭)
 */
interface StompChatMessage {
  roomId: string;
  senderId: number;
  senderNickname: string;
  content: string;
  sentAt: string; // ISO
  domain: "LIVEBOARD" | "EXCHANGE" | "LOCATION";
  favTeamSymbolUrl?: string | null;
}

function toBubbleMessage(
  msg: StompChatMessage,
  myUserId: number | undefined,
): ChatBubbleMessage {
  const time = new Date(msg.sentAt).toTimeString().slice(0, 5);
  return {
    key: `${msg.senderId}-${msg.sentAt}-${msg.content}`,
    senderId: msg.senderId,
    author: msg.senderNickname,
    text: msg.content,
    time,
    mine: myUserId !== undefined && msg.senderId === myUserId,
  };
}

interface UseChatPanelReturn {
  messages: ChatBubbleMessage[];
  draft: string;
  setDraft: (v: string) => void;
  isConnected: boolean;
  scrollRef: React.RefObject<ScrollView | null>;
  handleSend: () => void;
}

/**
 * useChatPanel
 *
 * Why: ChatPanel의 STOMP 구독·전송·optimistic update 로직을 UI로부터 분리.
 * 컴포넌트는 반환 값만 렌더링하면 됨.
 */
export function useChatPanel(matchId: string): UseChatPanelReturn {
  const { user } = useAuth();
  const roomId = `LIVEBOARD_${matchId}`;
  const { client, status } = useWebSocket(roomId, "liveboard");
  const isConnected = status === "CONNECTED";

  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView | null>(null);

  // 구독: 새 메시지 수신 시 목록에 추가 + optimistic 대체
  useEffect(() => {
    if (!client || !isConnected) return;

    const subscription = client.subscribe(
      `/server/liveboard/room/${roomId}`,
      (frame) => {
        try {
          const parsed = JSON.parse(frame.body) as StompChatMessage;
          const bubble = toBubbleMessage(parsed, user?.userId);

          setMessages((prev) => {
            const withoutOptimistic = bubble.mine
              ? prev.filter(
                  (m) =>
                    !(
                      m.key.startsWith("local-") &&
                      m.senderId === bubble.senderId &&
                      m.text === bubble.text
                    ),
                )
              : prev;

            if (withoutOptimistic.some((m) => m.key === bubble.key)) {
              return withoutOptimistic;
            }
            return [...withoutOptimistic, bubble];
          });
        } catch {
          // 파싱 실패한 메시지는 무시
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, isConnected, roomId, user?.userId]);

  // 새 메시지 도착 시 하단 스크롤
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content) return;

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

    const localKey = `local-${Date.now()}`;
    const optimistic: ChatBubbleMessage = {
      key: localKey,
      senderId: user.userId,
      author: user.nickname ?? "나",
      text: content,
      time: new Date().toTimeString().slice(0, 5),
      mine: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      client.publish({
        destination: "/client/liveboard/send",
        body: JSON.stringify({ roomId, content }),
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.key !== localKey));
      Alert.alert("전송 실패", "메시지 전송에 실패했습니다.");
    }
  }, [client, draft, isConnected, roomId, user]);

  return { messages, draft, setDraft, isConnected, scrollRef, handleSend };
}
