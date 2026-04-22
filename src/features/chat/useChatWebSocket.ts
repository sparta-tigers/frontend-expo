import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { SendMessageRequest } from "./types";

/**
 * WebSocket 채팅 연결 훅
 * STOMP.js를 사용하여 실시간 채팅 기능 제공
 */

interface UseChatWebSocketProps {
  roomId: number;
  userId: number;
  onMessageReceived?: (message: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useChatWebSocket({
  roomId,
  userId,
  onMessageReceived,
  onConnect,
  onDisconnect,
  onError,
}: UseChatWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const clientRef = useRef<Client | null>(null);

  /**
   * WebSocket 연결 설정
   */
  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      // SockJS를 통한 WebSocket 연결
      const socket = new SockJS('http://localhost:8080/ws');
      const stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          // 인증 토큰이 필요한 경우 여기에 추가
          // 'Authorization': `Bearer ${token}`
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      // 연결 성공 콜백
      stompClient.onConnect = (frame) => {
        console.log('WebSocket 연결 성공:', frame);
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // 채팅방 구독
        stompClient.subscribe(`/topic/directRoom/${roomId}`, (message) => {
          try {
            const parsedMessage = JSON.parse(message.body);
            console.log('메시지 수신:', parsedMessage);
            onMessageReceived?.(parsedMessage);
          } catch (error) {
            console.error('메시지 파싱 에러:', error);
          }
        });

        onConnect?.();
      };

      // 연결 에러 콜백
      stompClient.onStompError = (frame) => {
        console.error('WebSocket STOMP 에러:', frame);
        setIsConnected(false);
        setConnectionStatus('error');
        onError?.(frame);
      };

      // 연결 해제 콜백
      stompClient.onDisconnect = () => {
        console.log('WebSocket 연결 해제');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();
      };

      clientRef.current = stompClient;
      stompClient.activate();

    } catch (error) {
      console.error('WebSocket 연결 설정 에러:', error);
      setConnectionStatus('error');
      onError?.(error);
    }
  }, [roomId, onMessageReceived, onConnect, onDisconnect, onError]);

  /**
   * 메시지 전송 함수
   */
  const sendMessage = useCallback((messageData: SendMessageRequest) => {
    if (!clientRef.current?.connected) {
      console.error('WebSocket이 연결되지 않음');
      return false;
    }

    try {
      clientRef.current.publish({
        destination: '/client/directRoom/send',
        body: JSON.stringify({
          ...messageData,
          senderId: userId,
          roomId: roomId,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log('메시지 전송 완료:', messageData);
      return true;
    } catch (error) {
      console.error('메시지 전송 에러:', error);
      return false;
    }
  }, [userId, roomId]);

  /**
   * WebSocket 연결 해제
   */
  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
    }
  }, []);

  /**
   * 컴포넌트 언마운트 시 연결 해제
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  /**
   * 자동 연결 (roomId 변경 시)
   */
  useEffect(() => {
    if (roomId && userId) {
      connect();
    }
  }, [roomId, userId, connect]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
  };
}

/**
 * WebSocket 연결 상태를 위한 타입
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * 채팅 메시지 타입 (백엔드 스펙 기반)
 */
export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  timestamp: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
}
