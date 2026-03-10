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
  location: LocationDto;
  imageUrl?: string;
  images?: string[]; // 이미지 배열 추가
  desiredItem?: string; // 희망 교환 물품 추가
  status: "REGISTERED" | "COMPLETED" | "FAILED" | "DELETED";
  createdAt: string;
  updatedAt: string;
  userId: number;
  user: {
    id: number;
    nickname: string;
    profileImage?: string; // 프로필 이미지 추가
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
 * 백엔드 CreateExchangeRequestDto 스펙 매칭
 */
export interface CreateExchangeDto {
  itemId: number;
  message?: string; // 선택적 메시지
}

/**
 * 교환 요청 상태 변경 페이로드
 * 백엔드 UpdateExchangeRequestDto 스펙 매칭
 */
export interface UpdateExchangeStatusDto {
  status: ExchangeRequestStatus;
  message?: string; // 선택적 응답 메시지
}

/**
 * 받은 교환 요청 응답 모델
 * 백엔드 ReceiveRequestResponseDto 스펙 매칭
 * 현재는 ExchangeRequest와 동일한 구조
 */
// export interface ReceiveRequestResponseDto extends ExchangeRequest {
//   // 추가 필드가 있다면 여기에 확장
// }
// 현재는 ExchangeRequest 타입을 그대로 사용
export type ReceiveRequestResponseDto = ExchangeRequest;

/**
 * 교환 요청 목록 페이징 응답
 */
export interface ExchangeRequestListResponse {
  content: ExchangeRequest[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
