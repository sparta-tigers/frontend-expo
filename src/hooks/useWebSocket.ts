import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "../utils/tokenStore";

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

/**
 * Polyfill 방어 코드
 * React Native 환경에서 TextEncoder 확인
 */
const checkPolyfills = () => {
  if (!global.TextEncoder) {
    console.warn(
      "TextEncoder polyfill missing. WebSocket connection may fail. " +
        "Ensure 'fast-text-encoding' is imported in app/_layout.tsx",
    );
    return false;
  }
  return true;
};

/**
 * URL 프로토콜 처리
 * http/https -> SockJS 호환, ws/wss -> 직접 연결
 */
const normalizeUrl = (url?: string): string => {
  const defaultUrl = "ws://localhost:8080/ws";

  if (!url) return defaultUrl;

  // http/https로 시작하면 SockJS 사용 (백엔드 핸드셰이크 호환)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // ws/wss로 시작하면 그대로 사용 (직접 WebSocket)
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return url;
  }

  // 그 외의 경우 기본값 사용
  return defaultUrl;
};

/**
 * WebSocket 훅 (State-Driven Architecture)
 * 백엔드 WebSocket 서버와의 실시간 통신을 관리
 *
 * @param url - WebSocket 서버 URL
 * @returns WebSocket 연결 상태 및 제어 함수들
 */
export function useWebSocket(url?: string): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionState>("DISCONNECTED");
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
      console.log("WebSocket already connected");
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
          },
          debug: (str) => {
            console.log("STOMP Debug (SockJS):", str);
          },
        });
      } else {
        // 직접 WebSocket 연결
        stompClient = new Client({
          brokerURL: normalizedUrl,
          connectHeaders: {
            Authorization: `Bearer ${accessToken || ""}`,
          },
          debug: (str) => {
            console.log("STOMP Debug (Direct):", str);
          },
        });
      }

      // State-Driven 콜백들
      stompClient.onConnect = () => {
        console.log("WebSocket CONNECTED");
        setStatus("CONNECTED");
      };

      stompClient.onStompError = (frame) => {
        console.error("STOMP Error:", frame);
        setStatus("ERROR");
      };

      stompClient.onDisconnect = () => {
        console.log("WebSocket DISCONNECTED");
        setStatus("DISCONNECTED");
      };

      // Ref에 저장
      clientRef.current = stompClient;

      // 연결 활성화
      stompClient.activate();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setStatus("ERROR");
    }
  }, [url]);

  /**
   * WebSocket 연결 해제 함수
   */
  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
      console.log("WebSocket disconnected");
      setStatus("DISCONNECTED");
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
      console.warn("WebSocket not connected. Cannot send message.");
    }
  }, []);

  // 컴포넌트 마운트 시 자동 연결
  useEffect(() => {
    connect();

    // Cleanup Logic: 컴포넌트 언마운트 시 정리
    return () => {
      if (clientRef.current?.connected) {
        clientRef.current.deactivate();
        console.log("WebSocket cleanup: deactivated");
      }
      setStatus("DISCONNECTED");
      console.log("WebSocket cleanup: state reset");
    };
  }, [connect]);

  return {
    status,
    client: clientRef.current,
    connect,
    disconnect,
    sendMessage,
  };
}
