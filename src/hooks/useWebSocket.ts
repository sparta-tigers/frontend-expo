import { useEffect, useRef, useState } from "react";
import {
  checkSTOMPCompatibility,
  testWebSocketConnection,
  WebSocketConnection,
  WebSocketOptions,
} from "../utils/websocket";

/**
 * WebSocket 훅
 * React Native 환경에서 WebSocket 연결 관리
 */
export function useWebSocket(url: string, options?: Partial<WebSocketOptions>) {
  const [connection, setConnection] = useState<WebSocketConnection | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<WebSocketConnection | null>(null);

  /**
   * WebSocket 연결 초기화
   */
  const connect = async () => {
    try {
      setError(null);

      // 1. WebSocket 기본 연결 테스트
      const canConnect = await testWebSocketConnection(url);
      if (!canConnect) {
        setError("WebSocket 서버에 연결할 수 없습니다");
        return;
      }

      // 2. STOMP.js 호환성 검증
      const stompCompatible = checkSTOMPCompatibility();
      if (!stompCompatible) {
        setError("STOMP.js를 사용할 수 없습니다");
        return;
      }

      // 3. 연결 생성 (실제 구현 시 STOMP.js 연결)
      const newConnection: WebSocketConnection = {
        url,
        status: "CONNECTING",
      };

      setConnection(newConnection);
      connectionRef.current = newConnection;
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "연결 실패";
      setError(errorMessage);
      setIsConnected(false);
    }
  };

  /**
   * WebSocket 연결 해제
   */
  const disconnect = () => {
    if (connectionRef.current) {
      // TODO: 실제 STOMP.js disconnect 구현
      connectionRef.current.status = "DISCONNECTED";
      setConnection(null);
      setIsConnected(false);
      connectionRef.current = null;
    }
  };

  /**
   * 메시지 전송
   */
  const sendMessage = (destination: string, body: any) => {
    if (
      !connectionRef.current ||
      connectionRef.current.status !== "CONNECTED"
    ) {
      setError("WebSocket이 연결되지 않았습니다");
      return false;
    }

    try {
      // TODO: 실제 STOMP.js send 구현
      console.log(`메시지 전송: ${destination}`, body);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "메시지 전송 실패";
      setError(errorMessage);
      return false;
    }
  };

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connection,
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage,
  };
}
