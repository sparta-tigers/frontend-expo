export interface CreateDirectRoomRequest {
  exchangeRequestId: number;
}

export interface DirectRoomCreateResponse {
  directRoomId: number;
  exchangeRequestId: number;
  createdAt: string;
}

export interface DirectRoomResponse {
  directRoomId: number;
  exchangeRequestId: number;
  participant: {
    id: number;
    nickname: string;
  };
  opponentNickname: string;
  opponentOnline: boolean;
  itemTitle: string;
  lastMessage?: {
    id: number;
    content: string;
    senderId: number;
    createdAt: string;
  };
  createdAt: string;
}

export interface DirectRoomListResponse {
  rooms: DirectRoomResponse[];
}

/**
 * 백엔드 DirectRoomMessageResponse 스펙 일치
 * - messageId (NOT id)
 * - message (NOT content)
 * - senderNickname (NOT sender.nickname)
 * - sentAt: LocalDateTime 문자열
 */
export interface ChatMessage {
  messageId: number;
  senderId: number;
  senderNickname: string;
  /** 백엔드 필드명이 `message` 임. `content` 아님! */
  message: string;
  sentAt: string;
  /** FE 코드 호환성을 위한 별칭 컴폨티드 필드 */
  isMyMessage?: boolean;
}

/**
 * 백엔드 Page<DirectRoomMessageResponse> 스펙 매칭
 * Page 객체는 content, totalElements 등 파지유엁 필드를 포함
 */
export interface ChatMessageListResponse {
  content: ChatMessage[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface SendMessageRequest {
  content: string;
}
