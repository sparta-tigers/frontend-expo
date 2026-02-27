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

export interface CreateItemRequest extends ItemDto {
  location: LocationDto;
}

export interface Item {
  id: number;
  category: ItemCategory;
  title: string;
  description: string;
  location: LocationDto;
  imageUrl?: string;
  status: "REGISTERED" | "EXCHANGE_COMPLETED" | "EXCHANGE_FAILED";
  createdAt: string;
  updatedAt: string;
  userId: number;
  user: {
    id: number;
    nickname: string;
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
