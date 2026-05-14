import { Logger } from "@/src/utils/logger";
import { getAccessToken } from "@/src/utils/tokenStore";
import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import SockJS from "sockjs-client";

const chatLogger = Logger.category('CHAT');

/**
 * WebSocket 연결 상태 (State-Driven)
 */
export type ConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

/**
 * WebSocket 훅 반환값
 */
interface UseWebSocketReturn {
  status: ConnectionState;
  client: Client | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (destination: string, body: unknown) => void;
}

/**
 * 채팅 도메인 타입
 * 백엔드 StompInterceptor의 ChatDomain 헤더와 정확히 매칭되어야 함
 * - "liveboard" → ChatDomainType.LIVEBOARD
 * - "directroom" → ChatDomainType.EXCHANGE
 * - "location" → ChatDomainType.LOCATION
 */
type ChatDomain = "liveboard" | "directroom" | "location";

/**
 * Polyfill 방어 코드
 * React Native 환경에서 TextEncoder 확인
 */
const checkPolyfills = (): boolean => {
  if (!global.TextEncoder) {
    chatLogger.warn(
      "TextEncoder polyfill missing. WebSocket connection may fail. " +
        "Ensure 'fast-text-encoding' is imported in app/_layout.tsx",
    );
    return false;
  }
  return true;
};

/**
 * 동적 WebSocket URL 설정
 * 1. 명시적으로 전달된 url 인자를 최우선으로 사용
 * 2. 환경 변수(EXPO_PUBLIC_WS_BASE_URL) 사용
 * 3. 기본값으로 localhost 사용
 * 4. 개발 환경의 안드로이드 에뮬레이터에서는 localhost를 10.0.2.2로 치환
 */
const getWebSocketURL = (url?: string): string => {
  const envUrl = process.env.EXPO_PUBLIC_WS_BASE_URL;
  const defaultUrl = "http://localhost:8080/ws";
  const resolved = url || envUrl || defaultUrl;

  // 개발 환경 + 안드로이드 에뮬레이터 + (환경변수가 없거나 localhost인 경우) → 10.0.2.2로 치환
  if (__DEV__ && Platform.OS === "android") {
    // 환경 변수조차 설정되지 않았을 때만 에뮬레이터 전용 IP로 폴백
    if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      return resolved.replace(/localhost|127\.0\.0\.1/, "10.0.2.2");
    }
  }

  return resolved;
};

/**
 * WebSocket 훅 (State-Driven Architecture)
 *
 * @param roomId - 채팅방 ID (directroom 도메인에서는 필수)
 * @param chatDomain - 채팅 도메인 타입 (백엔드 Interceptor Fail-fast 검증 대상)
 * @param url - WebSocket 서버 URL (기본값: http://localhost:8080/ws)
 */
export function useWebSocket(
  roomId?: string | number,
  chatDomain: ChatDomain = "directroom",
  url?: string,
): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionState>("DISCONNECTED");
  const [client, setClient] = useState<Client | null>(null);
  const clientRef = useRef<Client | null>(null);
  const connectingRef = useRef(false);

  /**
   * WebSocket 연결 함수
   */
  const connect = useCallback(async () => {
    // [SAFETY] directroom 도메인인데 roomId가 없으면 연결 시도 금지
    if (
      chatDomain === "directroom" &&
      (!roomId || roomId === "undefined" || roomId === "null")
    ) {
      chatLogger.warn("roomId가 유효하지 않아 연결을 중단합니다", { roomId });
      setStatus("ERROR");
      return;
    }

    // Polyfill 확인
    if (!checkPolyfills()) {
      setStatus("ERROR");
      return;
    }

    // 중복 연결 방어
    if (connectingRef.current || clientRef.current?.connected) {
      return;
    }

    connectingRef.current = true;
    setStatus("CONNECTING");

    try {
      const accessToken = await getAccessToken();
      const resolvedUrl = getWebSocketURL(url);

      const useSockJS =
        resolvedUrl.startsWith("http://") || resolvedUrl.startsWith("https://");

      const stompClient = new Client({
        ...(useSockJS
          ? { webSocketFactory: () => new SockJS(resolvedUrl) }
          : { brokerURL: resolvedUrl }),
        connectHeaders: {
          Authorization: `Bearer ${accessToken || ""}`,
          ChatDomain: chatDomain,
          // [DEBUG] roomId를 헤더에 포함하여 서버 로그에서 추적 가능하게 함
          RoomId: String(roomId || ""),
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      stompClient.onConnect = () => {
        chatLogger.debug(`STOMP CONNECTED`, { chatDomain, roomId });
        connectingRef.current = false;
        setStatus("CONNECTED");
      };

      stompClient.onStompError = (frame) => {
        chatLogger.error("STOMP Error 발생", frame);
        connectingRef.current = false;
        setStatus("ERROR");
      };

      stompClient.onWebSocketError = (event) => {
        chatLogger.error("WebSocket transport error", event);
        connectingRef.current = false;
        setStatus("ERROR");
      };

      stompClient.onDisconnect = () => {
        chatLogger.debug("STOMP DISCONNECTED");
        connectingRef.current = false;
        setStatus("DISCONNECTED");
      };

      clientRef.current = stompClient;
      setClient(stompClient);

      stompClient.activate();
    } catch (error) {
      chatLogger.error("connection error", error);
      connectingRef.current = false;
      setStatus("ERROR");
    }
  }, [chatDomain, roomId, url]);

  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      void clientRef.current.deactivate();
    }
    connectingRef.current = false;
    setStatus("DISCONNECTED");
    setClient(null);
  }, []);

  const sendMessage = useCallback((destination: string, body: unknown) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
    } else {
      chatLogger.warn("not connected. Cannot send message.");
    }
  }, []);

  useEffect(() => {
    void connect();

    return () => {
      if (clientRef.current?.connected) {
        void clientRef.current.deactivate();
      }
      clientRef.current = null;
      connectingRef.current = false;
      setClient(null);
      setStatus("DISCONNECTED");
    };
  }, [connect]);

  return {
    status,
    client,
    connect,
    disconnect,
    sendMessage,
  };
}
