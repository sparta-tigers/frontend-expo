/**
 * 교환 요청 관련 타입 정의
 * 아이템 교환 신청, 처리 등 교환 도메인 데이터 구조
 */

/**
 * 교환 요청 생성 요청 인터페이스
 * 특정 아이템에 대한 교환 신청
 */
export interface ExchangeRequestRequest {
  /** 교환 요청을 받을 사용자 ID */
  receiverId: number;
  /** 교환할 아이템 ID */
  itemId: number;
}

/**
 * 교환 요청 발신자 정보 인터페이스
 * 교환 요청을 보낸 사용자의 기본 정보
 */
export interface ExchangeRequestSender {
  /** 발신자 사용자 ID */
  userId: number;
  /** 발신자 닉네임 */
  userNickname: string;
}

/**
 * 교환 요청 상태 타입
 * Java의 Enum과 유사한 역할
 * - PENDING: 대기 중
 * - ACCEPTED: 수락됨
 * - REJECTED: 거절됨
 */
export type ExchangeRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/**
 * 교환 요청 아이템 정보 인터페이스
 * 교환 요청 목록 조회 시 사용되는 데이터 구조
 */
export interface ExchangeRequestItem {
  /** 교환 요청 아이템 고유 ID */
  id: number;
  /** 교환 요청 고유 ID */
  exchangeRequestId: number;
  /** 교환할 아이템 고유 ID */
  itemId: number;
  /** 아이템 제목 */
  title: string;
  /** 아이템 카테고리 */
  category: string;
  /** 교환 요청 발신자 정보 */
  sender: ExchangeRequestSender;
  /** 교환 요청 상태 */
  status: ExchangeRequestStatus;
  /** 교환 요청 생성 시간 */
  createdAt: string;
}

/**
 * 교환 요청 기본 정보 인터페이스
 * 교환 요청의 핵심 데이터
 */
export interface ExchangeRequest {
  /** 교환 요청 고유 ID */
  id: number;
  /** 교환 요청 발신자 ID */
  senderId: number;
  /** 교환 요청 수신자 ID */
  receiverId: number;
  /** 교환할 아이템 ID */
  itemId: number;
  /** 교환 요청 상태 */
  status: string;
  /** 교환 요청 생성 시간 */
  createdAt: string;
  /** 교환 요청 수정 시간 */
  updatedAt: string;
}

/**
 * 페이징 정보 인터페이스
 * 페이징 처리된 응답의 공통 구조
 */
export interface PageInfo {
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
 * 교환 요청 목록 응답 인터페이스
 * 페이징 처리된 교환 요청 목록
 */
export interface ExchangeRequestListResponse {
  /** 교환 요청 목록 데이터 */
  content: ExchangeRequestItem[];
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
 * 교환 요청 수정 요청 인터페이스
 * 교환 요청 상태 변경 (수락/거절)
 */
export interface UpdateExchangeRequestRequest {
  /** 변경할 교환 요청 상태 */
  status: ExchangeRequestStatus;
}
