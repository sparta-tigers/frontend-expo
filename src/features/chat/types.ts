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

export interface ChatMessage {
  id: number;
  directRoomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    nickname: string;
  };
}

export interface ChatMessageListResponse {
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  content: string;
}
