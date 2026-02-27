/**
 * 채팅방 관련 타입 정의
 * 1:1 채팅방, 메시지 등 채팅 도메인 데이터 구조
 */

/**
 * 채팅방 생성 요청 인터페이스
 * 교환 요청 ID를 기반으로 1:1 채팅방 생성
 */
export interface CreateDirectRoomRequest {
  /** 교환 요청 고유 ID */
  exchangeRequestId: number;
}

/**
 * 채팅방 생성 응답 인터페이스
 * 생성된 채팅방의 기본 정보
 */
export interface DirectRoomCreateResponse {
  /** 생성된 채팅방 고유 ID */
  directRoomId: number;
  /** 연결된 교환 요청 ID */
  exchangeRequestId: number;
  /** 채팅방 생성 시간 */
  createdAt: string;
}

/**
 * 채팅방 정보 인터페이스
 * 채팅방 목록 조회 시 사용되는 데이터 구조
 */
export interface DirectRoomResponse {
  /** 채팅방 고유 ID */
  directRoomId: number;
  /** 연결된 교환 요청 ID */
  exchangeRequestId: number;
  /** 교환 아이템 제목 */
  itemTitle: string;
  /** 교환 아이템 이미지 URL */
  itemImage: string;
  /** 상대방 닉네임 */
  opponentNickname: string;
  /** 상대방 온라인 상태 */
  opponentOnline: boolean;
  /** 채팅방 생성 시간 */
  createdAt: string;
}

/**
 * 채팅방 목록 응답 인터페이스
 * 페이징 처리된 채팅방 목록
 */
export interface DirectRoomListResponse {
  /** 채팅방 목록 데이터 */
  content: DirectRoomResponse[];
  /** 현재 페이지 번호 */
  pageNumber: number;
  /** 페이지당 데이터 크기 */
  pageSize: number;
  /** 전체 데이터 개수 */
  totalElements: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 마지막 페이지 여부 */
  last: boolean;
  /** 첫 페이지 여부 */
  first: boolean;
}

/**
 * 채팅 메시지 데이터 인터페이스
 * 서버에서 수신한 원본 메시지 데이터
 */
export interface ChatMessageData {
  /** 메시지 내용 */
  message: string;
  /** 메시지 전송 시간 */
  sentAt: string;
  /** 발신자 닉네임 */
  senderNickname: string;
  /** 발신자 고유 ID */
  senderId: number;
}

/**
 * 채팅 메시지 인터페이스
 * UI에서 표시되는 메시지 데이터
 */
export interface ChatMessage {
  /** 메시지 내용 */
  content: string;
  /** 메시지 전송 시간 */
  sentAt: string;
  /** 발신자 닉네임 */
  senderNickName: string;
  /** 내 메시지 여부 */
  isMyMessage: boolean;
}

/**
 * 채팅 메시지 목록 응답 인터페이스
 * 페이징 처리된 메시지 목록
 */
export interface ChatMessageListResponse {
  /** 메시지 목록 데이터 */
  content: ChatMessageData[];
  /** 현재 페이지 번호 */
  pageNumber: number;
  /** 페이지당 데이터 크기 */
  pageSize: number;
  /** 전체 데이터 개수 */
  totalElements: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 마지막 페이지 여부 */
  last: boolean;
  /** 첫 페이지 여부 */
  first: boolean;
}

/**
 * 메시지 전송 요청 인터페이스
 * WebSocket을 통한 메시지 전송 시 사용
 */
export interface SendMessageRequest {
  /** 채팅방 ID */
  roomId: string;
  /** 전송할 메시지 내용 */
  message: string;
}
