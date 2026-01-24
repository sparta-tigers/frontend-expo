import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as SecureStore from "expo-secure-store";

/**
 * WebSocket 연결 상태
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
  connectionState: ConnectionState;
  stompClient: Client | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (destination: string, body: any) => void;
}

/**
 * WebSocket 훅
 * 백엔드 WebSocket 서버와의 실시간 통신을 관리
 *
 * @param url - WebSocket 서버 URL
 * @returns WebSocket 연결 상태 및 제어 함수들
 */
export function useWebSocket(url?: string): UseWebSocketReturn {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("DISCONNECTED");
  const stompClientRef = useRef<Client | null>(null);

  /**
   * WebSocket 연결 함수
   */
  const connect = useCallback(async () => {
    if (stompClientRef.current?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    setConnectionState("CONNECTING");

    try {
      // JWT 토큰 가져오기
      const accessToken = await SecureStore.getItemAsync("accessToken");

      // SockJS를 통해 WebSocket 연결
      const socket = new SockJS(url || "ws://localhost:8080/ws");

      // STOMP 클라이언트 생성
      const stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          // JWT 토큰을 헤더에 추가
          Authorization: `Bearer ${accessToken || ""}`,
        },
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
      });

      // 연결 성공 콜백
      stompClient.onConnect = () => {
        console.log("WebSocket CONNECTED");
        setConnectionState("CONNECTED");
      };

      // 연결 에러 콜백
      stompClient.onStompError = (frame) => {
        console.error("STOMP Error:", frame);
        setConnectionState("ERROR");
      };

      // 연결 해제 콜백
      stompClient.onDisconnect = () => {
        console.log("WebSocket DISCONNECTED");
        setConnectionState("DISCONNECTED");
      };

      stompClientRef.current = stompClient;

      // WebSocket 연결 활성화
      stompClient.activate();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnectionState("ERROR");
    }
  }, [url]);

  /**
   * WebSocket 연결 해제 함수
   */
  const disconnect = useCallback(() => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.deactivate();
      console.log("WebSocket disconnected");
      setConnectionState("DISCONNECTED");
    }
  }, []);

  /**
   * 메시지 전송 함수
   *
   * @param destination - 메시지 목적지 (예: "/client/chat")
   * @param body - 전송할 데이터
   */
  const sendMessage = (destination: string, body: any) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination,
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
    } else {
      console.warn("WebSocket not connected. Cannot send message.");
    }
  };

  // 컴포넌트 언마운트 시 자동 연결
  useEffect(() => {
    connect();

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  return {
    connectionState,
    stompClient: stompClientRef.current,
    connect,
    disconnect,
    sendMessage,
  };
}
