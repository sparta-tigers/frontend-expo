export type ItemCategory = "TICKET" | "GOODS";

export interface ItemDto {
  category: ItemCategory;
  title: string;
  description: string;
}

export interface LocationDto {
  latitude: number;
  longitude: number;
  address: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * 아이템 생성 요청 타입
 * 백엔드 CreateItemWithLocationRequestDto 스펙에 맞춰 재정의
 */
export interface CreateItemRequest {
  itemCategory: ItemCategory; // 백엔드 ItemCategory enum과 매핑
  title: string;
  description: string;
  location: LocationDto;
  images?: string[]; // 이미지 배열 추가
  desiredItem?: string; // 희망 교환 물품 추가
}

/**
 * 아이템 수정 요청 타입
 * 백엔드 UpdateItemRequestDto 스펙에 맞춰 정의
 */
export interface UpdateItemRequest {
  category: ItemCategory; // 백엔드는 category 필드명 사용
  title?: string; // 수정 시 선택적 필드
  description?: string; // 수정 시 선택적 필드
}

export interface Item {
  id: number;
  category: ItemCategory;
  title: string;
  description: string;
  latitude: number; // 백엔드에서 개별 필드로 옴
  longitude: number; // 백엔드에서 개별 필드로 옴
  address: string; // 백엔드에서 개별 필드로 옴
  imageUrl?: string;
  /**
   * 백엔드 ReadItemResponseDto.imageUrls 와 매핑되는 표준 필드
   * 이미지 캐러셀 렌더링 시 반드시 이 필드를 우선 사용할 것
   */
  imageUrls?: string[];
  images?: string[]; // 하위 호환 유지 (imageUrls를 우선 사용)
  desiredItem?: string; // 희망 교환 물품 추가
  status: "REGISTERED" | "COMPLETED" | "FAILED" | "DELETED";
  createdAt: string;
  updatedAt: string;
  userId?: number; // 체인을 위한 호환 필드
  user: {
    userId: number;       // UserResponseDto.userId (백엔드 스펙)
    userNickname: string;  // UserResponseDto.userNickname (백엔드 스펙)
    profileImage?: string;
  };

  // 호환성을 위한 computed 속성
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

/**
 * 교환 요청 상태 Enum
 * 백엔드 스펙 기반 상태값 관리
 */
export enum ExchangeRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

/**
 * 교환 요청 응답 모델
 * 백엔드에서 반환하는 교환 요청 정보
 */
export interface ExchangeRequest {
  id: number;
  roomId?: number; // 채팅방 ID (수락된 경우 서버에서 포함 가능)
  itemId: number;
  requesterId: number;
  providerId: number;
  status: ExchangeRequestStatus;
  createdAt: string;
  updatedAt?: string;
  // 연관 정보
  item?: Item;
  requester?: {
    id: number;
    nickname: string;
  };
  provider?: {
    id: number;
    nickname: string;
  };
}

/**
 * 교환 요청 생성 페이로드
 * 백엔드 `ExchangeRequestDto` 스펙 정확히 매칭
 *
 * @field receiverId - 아이템 등록자의 userId (필수)
 * @field itemId - 교환을 원하는 아이템 ID (필수)
 * @field have - 렬요청자가 제안하는 교환 물건 설명 (필수, @NotBlank)
 */
export interface CreateExchangeDto {
  receiverId: number;
  itemId: number;
  have: string; // 내가 제안하는 교환 물건 설명 (필수)
}

/**
 * 교환 요청 상태 변경 페이로드
 * 백엔드 UpdateExchangeRequestDto 스펙 매칭
 */
export interface UpdateExchangeStatusDto {
  status: ExchangeRequestStatus;
}

/**
 * 받은/보낸 교환 요청 응답 모델 — 백엔드 ReceiveRequestResponseDto 정확 매핑
 *
 * 백엔드는 ExchangeRequest Entity가 아닌 별도 DTO를 반환:
 * - `exchangeRequestId` (NOT `id`)
 * - `sender` = 요청 보낸 사람 (NOT `requester`)
 * - `title`, `category`, `status` 는 item 중첩 없이 flat 구조
 */
export interface ReceiveExchangeRequest {
  /** 교환 요청 고유 ID (백엔드 exchangeRequestId 필드) */
  exchangeRequestId: number;
  /** 교환 대상 아이템 ID */
  itemId: number;
  /**
   * 교환을 요청한 사람 정보 (백엔드 UserResponseDto)
   * 주의: requester가 아닌 sender 필드명 사용
   */
  sender: {
    userId: number;
    userNickname: string;
  };
  /** 아이템 카테고리 (flat — item.category 로 접근하지 말 것) */
  category: ItemCategory;
  /** 아이템 제목 (flat — item.title 로 접근하지 말 것) */
  title: string;
  /**
   * 아이템 상태 (ItemStatus 기반)
   * 교환 요청 상태(ExchangeStatus)와 다름!
   */
  status: "REGISTERED" | "COMPLETED" | "FAILED" | "DELETED";
  /** 교환 요청 생성 시각 */
  createdAt: string;
}

/**
 * 교환 요청 목록 페이징 응답
 * content 항목은 ReceiveExchangeRequest 구조임
 */
export interface ExchangeRequestListResponse {
  content: ReceiveExchangeRequest[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
