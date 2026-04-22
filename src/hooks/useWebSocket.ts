import { Logger } from "@/src/utils/logger";
import { getAccessToken } from "@/src/utils/tokenStore";
import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import SockJS from "sockjs-client";

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
    Logger.warn(
      "TextEncoder polyfill missing. WebSocket connection may fail. " +
        "Ensure 'fast-text-encoding' is imported in app/_layout.tsx",
    );
    return false;
  }
  return true;
};

/**
 * 동적 WebSocket URL 설정
 * 개발 환경의 안드로이드 에뮬레이터에서는 10.0.2.2로 강제 설정
 */
const getWebSocketURL = (url?: string): string => {
  const defaultUrl = "http://localhost:8080/ws";
  const resolved = url || defaultUrl;

  // 개발 환경 + 안드로이드 에뮬레이터 → localhost를 10.0.2.2로 치환
  if (__DEV__ && Platform.OS === "android") {
    return resolved.replace(/localhost|127\.0\.0\.1/, "10.0.2.2");
  }

  return resolved;
};

/**
 * WebSocket 훅 (State-Driven Architecture)
 *
 * [Migration Note] useChatWebSocket.ts의 핵심 로직을 병합:
 * ① 비동기 JWT 토큰 Fetch (await getAccessToken())
 * ② 중복 연결 방어 락 (connectingRef로 race condition 방지)
 *
 * @param url - WebSocket 서버 URL (기본값: http://localhost:8080/ws)
 * @param chatDomain - 채팅 도메인 타입 (백엔드 Interceptor Fail-fast 검증 대상)
 */
export function useWebSocket(
  url?: string,
  chatDomain: ChatDomain = "directroom",
): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionState>("DISCONNECTED");
  /**
   * [BUG FIX] clientRef와 별도로 client 상태를 useState로 관리
   * clientRef.current는 ref 변경 시 리렌더를 트리거하지 않아 컴포넌트가
   * 항상 null을 받는 문제가 있었음. useState와 병행 관리로 해결.
   */
  const [client, setClient] = useState<Client | null>(null);
  const clientRef = useRef<Client | null>(null);

  /**
   * [Migration from useChatWebSocket] 중복 연결 방어 락
   * useCallback 내부에서 상태를 읽지 않고 ref로 관리하여
   * 클로저 캡처에 의한 stale 값 문제를 원천 차단
   */
  const connectingRef = useRef(false);

  /**
   * WebSocket 연결 함수
   */
  const connect = useCallback(async () => {
    // Polyfill 확인
    if (!checkPolyfills()) {
      setStatus("ERROR");
      return;
    }

    // [Migration] 중복 연결 방어 — 이미 연결 중이거나 연결된 상태면 무시
    if (connectingRef.current || clientRef.current?.connected) {
      Logger.debug("[useWebSocket] 이미 연결 중이거나 연결됨 — skip");
      return;
    }

    connectingRef.current = true;
    setStatus("CONNECTING");

    try {
      // [Migration from useChatWebSocket] 비동기 JWT 토큰 Fetch
      const accessToken = await getAccessToken();
      const resolvedUrl = getWebSocketURL(url);

      const useSockJS =
        resolvedUrl.startsWith("http://") ||
        resolvedUrl.startsWith("https://");

      const stompClient = new Client({
        // ✅ [CRITICAL FIX] SockJS 인스턴스를 webSocketFactory 내부에서 생성
        // 기존: new SockJS()를 외부에서 생성 → activate() 전에 소켓 상태 변이 → race condition
        // 수정: activate() 호출 시 팩토리가 실행되어 새 SockJS 인스턴스 생성
        ...(useSockJS
          ? { webSocketFactory: () => new SockJS(resolvedUrl) }
          : { brokerURL: resolvedUrl }),
        connectHeaders: {
          Authorization: `Bearer ${accessToken || ""}`,
          /**
           * [CRITICAL] ChatDomain 헤더 명시적 주입
           * 백엔드 StompInterceptor가 Fail-fast로 검증:
           * - null/blank → IllegalArgumentException → 연결 즉시 거부
           * - 매칭 불가 → IllegalArgumentException
           */
          ChatDomain: chatDomain,
        },
        // ✅ [FIX] reconnectDelay 추가 — 네트워크 불안정 시 5초 후 자동 재연결
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      // State-Driven 콜백들
      stompClient.onConnect = () => {
        Logger.debug("[useWebSocket] STOMP CONNECTED");
        connectingRef.current = false;
        setStatus("CONNECTED");
      };

      stompClient.onStompError = (frame) => {
        Logger.error("[useWebSocket] STOMP Error:", frame.headers?.message ?? frame);
        connectingRef.current = false;
        setStatus("ERROR");
      };

      stompClient.onWebSocketError = (event) => {
        Logger.error("[useWebSocket] WebSocket transport error:", event);
        connectingRef.current = false;
        setStatus("ERROR");
      };

      stompClient.onDisconnect = () => {
        Logger.debug("[useWebSocket] STOMP DISCONNECTED");
        connectingRef.current = false;
        setStatus("DISCONNECTED");
      };

      // Ref와 State 양쪽에 모두 저장
      clientRef.current = stompClient;
      setClient(stompClient);

      // 연결 활성화
      stompClient.activate();
    } catch (error) {
      Logger.error("[useWebSocket] connection error:", error);
      connectingRef.current = false;
      setStatus("ERROR");
    }
  }, [chatDomain, url]);

  /**
   * WebSocket 연결 해제 함수
   */
  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
      Logger.debug("[useWebSocket] disconnected");
    }
    connectingRef.current = false;
    setStatus("DISCONNECTED");
    setClient(null);
  }, []);

  /**
   * 메시지 전송 함수
   * @param destination - 메시지 목적지 (예: "/client/directRoom/send")
   * @param body - 전송할 데이터
   */
  const sendMessage = useCallback((destination: string, body: unknown) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
    } else {
      Logger.warn("[useWebSocket] not connected. Cannot send message.");
    }
  }, []);

  // 컴포넌트 마운트 시 자동 연결
  useEffect(() => {
    connect();

    // Cleanup: 컴포넌트 언마운트 시 정리
    return () => {
      if (clientRef.current?.connected) {
        clientRef.current.deactivate();
        Logger.debug("[useWebSocket] cleanup: deactivated");
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
