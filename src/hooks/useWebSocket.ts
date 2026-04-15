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
  sendMessage: (destination: string, body: any) => void;
}

type ChatDomain = "liveboard" | "directroom" | "location";

/**
 * Polyfill 방어 코드
 * React Native 환경에서 TextEncoder 확인
 */
const checkPolyfills = () => {
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
const getDynamicWebSocketURL = (url?: string): string => {
  const defaultUrl = "http://localhost:8080/ws";

  if (!url) {
    // 개발 환경의 안드로이드 에뮬레이터용 핫픽스
    if (__DEV__ && Platform.OS === "android") {
      return "http://10.0.2.2:8080/ws";
    }
    return defaultUrl;
  }

  // http/https로 시작하면 SockJS 사용 (백엔드 핸드셰이크 호환)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // 개발 환경의 안드로이드 에뮬레이터용 핫픽스
    if (__DEV__ && Platform.OS === "android") {
      return url.replace(/:\/\/[^:]+:\d+/, "://10.0.2.2:8080");
    }
    return url;
  }

  // ws/wss로 시작하면 그대로 사용 (직접 WebSocket)
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    // 개발 환경의 안드로이드 에뮬레이터용 핫픽스
    if (__DEV__ && Platform.OS === "android") {
      return url.replace(/:\/\/[^:]+:\d+/, "://10.0.2.2:8080");
    }
    return url;
  }

  // 그 외의 경우 기본값 사용
  return defaultUrl;
};

/**
 * URL 프로토콜 처리
 * http/https -> SockJS 호환, ws/wss -> 직접 연결
 */
const normalizeUrl = (url?: string): string => {
  return getDynamicWebSocketURL(url);
};

/**
 * WebSocket 훅 (State-Driven Architecture)
 * 백엔드 WebSocket 서버와의 실시간 통신을 관리
 *
 * @param url - WebSocket 서버 URL
 * @returns WebSocket 연결 상태 및 제어 함수들
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
   * WebSocket 연결 함수
   */
  const connect = useCallback(async () => {
    // Polyfill 확인
    if (!checkPolyfills()) {
      setStatus("ERROR");
      return;
    }

    // 이미 연결된 경우
    if (clientRef.current?.connected) {
      Logger.debug("WebSocket already connected");
      return;
    }

    setStatus("CONNECTING");

    try {
      // JWT 토큰 가져오기 (TokenStore 사용)
      const accessToken = await getAccessToken();

      const normalizedUrl = normalizeUrl(url);

      let stompClient: Client;

      // URL 프로토콜에 따라 연결 방식 결정
      if (
        normalizedUrl.startsWith("http://") ||
        normalizedUrl.startsWith("https://")
      ) {
        // SockJS를 통한 연결 (백엔드 핸드셰이크 호환)
        const socket = new SockJS(normalizedUrl);
        stompClient = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            Authorization: `Bearer ${accessToken || ""}`,
            ChatDomain: chatDomain,
          },
        });
      } else {
        // 직접 WebSocket 연결
        stompClient = new Client({
          brokerURL: normalizedUrl,
          connectHeaders: {
            Authorization: `Bearer ${accessToken || ""}`,
            ChatDomain: chatDomain,
          },
        });
      }

      // State-Driven 콜백들
      stompClient.onConnect = () => {
        Logger.debug("WebSocket CONNECTED");
        setStatus("CONNECTED");
      };

      stompClient.onStompError = (frame) => {
        Logger.error("STOMP Error:", frame);
        setStatus("ERROR");
      };

      stompClient.onDisconnect = () => {
        Logger.debug("WebSocket DISCONNECTED");
        setStatus("DISCONNECTED");
      };

      // [BUG FIX] Ref와 State 양쪽에 모두 저장
      // Ref: 안정적인 참조 보장 (disconnect, cleanup에서 사용)
      // State: 컴포넌트 리렌더 트리거 (onConnect 콜백 후 컴포넌트에 전달)
      clientRef.current = stompClient;
      setClient(stompClient);

      // 연결 활성화
      stompClient.activate();
    } catch (error) {
      Logger.error("WebSocket connection error:", error);
      setStatus("ERROR");
    }
  }, [chatDomain, url]);

  /**
   * WebSocket 연결 해제 함수
   */
  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
      Logger.debug("WebSocket disconnected");
      setStatus("DISCONNECTED");
      setClient(null);
    }
  }, []);

  /**
   * 메시지 전송 함수
   * @param destination - 메시지 목적지 (예: "/client/chat")
   * @param body - 전송할 데이터
   */
  const sendMessage = useCallback((destination: string, body: any) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
    } else {
      Logger.warn("WebSocket not connected. Cannot send message.");
    }
  }, []);

  // 컴포넌트 마운트 시 자동 연결
  useEffect(() => {
    connect();

    // Cleanup Logic: 컴포넌트 언마운트 시 정리
    return () => {
      if (clientRef.current?.connected) {
        clientRef.current.deactivate();
        Logger.debug("WebSocket cleanup: deactivated");
      }
      clientRef.current = null;
      setClient(null);
      setStatus("DISCONNECTED");
      Logger.debug("WebSocket cleanup: state reset");
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
