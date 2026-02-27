/**
 * 아이템 관련 타입 정의
 * 아이템 등록, 조회, 위치 정보 등 아이템 도메인 데이터 구조
 */

/**
 * 아이템 카테고리 타입
 * Java의 Enum과 유사한 역할
 * - TICKET: 경기 티켓
 * - GOODS: 굿즈/상품
 */
export type ItemCategory = "TICKET" | "GOODS";

/**
 * 아이템 기본 정보 DTO
 * 아이템 생성/수정에 필요한 핵심 데이터
 */
export interface ItemDto {
  /** 아이템 카테고리 */
  category: ItemCategory;
  /** 아이템 제목 */
  title: string;
  /** 아이템 상세 설명 */
  description: string;
}

/**
 * 위치 정보 DTO
 * 아이템 위치 또는 사용자 위치 정보
 */
export interface LocationDto {
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
}

/**
 * 아이템 생성 요청 인터페이스
 * 신규 아이템 등록에 필요한 모든 정보
 */
export interface CreateItemRequest {
  /** 아이템 기본 정보 */
  itemDto: ItemDto;
  /** 아이템 위치 정보 */
  locationDto: LocationDto;
}

/**
 * 아이템 사용자 정보 인터페이스
 * 아이템 등록자의 기본 정보
 */
export interface ItemUser {
  /** 사용자 고유 ID */
  userId: number;
  /** 사용자 닉네임 (호환성 유지) */
  nickname?: string;
  /** 사용자 닉네임 (표준) */
  userNickname?: string;
}

/**
 * 아이템 상태 타입
 * Java의 Enum과 유사한 역할
 * - REGISTERED: 등록됨
 * - COMPLETED: 교환 완료됨
 * - FAILED: 교환 실패함
 */
export type ItemStatus = "REGISTERED" | "COMPLETED" | "FAILED";

/**
 * 아이템 정보 인터페이스
 * 시스템 내 아이템의 전체 정보
 */
export interface Item {
  /** 아이템 고유 ID */
  id: number;
  /** 아이템 카테고리 */
  category: ItemCategory;
  /** 아이템 제목 */
  title: string;
  /** 아이템 상세 설명 */
  description: string;
  /** 아이템 이미지 URL (선택사항) */
  imageUrl?: string;
  /** 아이템 이미지 (호환성 유지) */
  image?: string;
  /** 아이템 상태 */
  status: ItemStatus;
  /** 아이템 등록자 정보 */
  user: ItemUser;
  /** 아이템 위치 정보 (선택사항) */
  location?: LocationDto;
  /** 아이템 생성 시간 */
  createdAt: string;
  /** 아이템 수정 시간 */
  updatedAt: string;
}

/**
 * 사용자 위치 정보 인터페이스
 * 실시간 사용자 위치 추적용
 */
export interface UserLocation {
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
}

/**
 * WebSocket 메시지 타입
 * 실시간 아이템 업데이트를 위한 메시지 종류
 */
export type WebSocketMessageType =
  | "ADD_ITEM" // 아이템 추가
  | "REFRESH_ITEMS" // 아이템 목록 새로고침
  | "USER_LOCATION_UPDATE" // 사용자 위치 업데이트
  | "REMOVE_ITEM"; // 아이템 제거

/**
 * WebSocket 메시지 인터페이스
 * 실시간 통신을 위한 표준 메시지 형식
 */
export interface WebSocketMessage {
  /** 메시지 타입 */
  type: WebSocketMessageType;
  /** 메시지 데이터 */
  data: any;
}

/**
 * 사용자 위치 업데이트 데이터 인터페이스
 * WebSocket을 통한 위치 정보 전송
 */
export interface UserLocationUpdateData {
  /** 사용자 고유 ID */
  userId: number;
  /** 업데이트된 위도 */
  latitude: number;
  /** 업데이트된 경도 */
  longitude: number;
}

/**
 * 아이템 제거 데이터 인터페이스
 * WebSocket을 통한 아이템 삭제 알림
 */
export interface RemoveItemData {
  /** 아이템을 제거한 사용자 ID */
  userId: number;
}

/**
 * 지도 마커 데이터 인터페이스
 * 지도에 표시될 마커 정보
 */
export interface MarkerData {
  /** 마커 고유 ID (사용자 ID) */
  id: string;
  /** 연결된 아이템 ID (없을 경우 null) */
  itemId: number | null;
  /** 마커 위도 */
  lat: number;
  /** 마커 경도 */
  lng: number;
  /** 마커 이미지 소스 */
  imageSrc: string;
  /** 마커 이미지 너비 */
  imageWidth: number;
  /** 마커 이미지 높이 */
  imageHeight: number;
  /** 마커 제목 */
  title: string;
  /** 내 마커 여부 */
  isMe: boolean;
}
