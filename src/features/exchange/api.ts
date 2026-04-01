import { apiClient } from "@/src/core/client";
import type { ApiResponse } from "@/src/shared/types/common";
import {
  CreateExchangeDto,
  ExchangeRequestListResponse,
  Item,
  ItemCategory,
  UpdateExchangeStatusDto,
  UpdateItemRequest,
  UserLocation,
} from "./types";

export type ExchangeRoomResponseDto = {
  roomId?: number;
  directRoomId?: number;
  exchangeRequestId?: number;
};

/**
 * 아이템 목록 조회 API
 * 모든 아이템 목록을 페이징 처리하여 반환
 *
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 20)
 * @param category - 아이템 카테고리 필터 (선택사항)
 * @param status - 아이템 상태 필터 (선택사항)
 * @param lat - 위도 좌표 (선택사항, 공간 검색용)
 * @param lng - 경도 좌표 (선택사항, 공간 검색용)
 * @param radiusKm - 검색 반경 (기본값: 2km)
 * @returns 페이징 처리된 아이템 목록
 */
export async function itemsGetListAPI(
  page: number = 0,
  size: number = 20,
  category?: ItemCategory,
  status?: string,
  lat?: number,
  lng?: number,
  radiusKm?: number,
): Promise<ApiResponse<any>> {
  const params: any = { page, size };
  if (category) params.category = category;
  if (status) params.status = status;

  // 좌표 기반 검색 파라미터 추가
  if (lat && lng) {
    params.latitude = lat;
    params.longitude = lng;
    params.radius = radiusKm || 2; // 기본 반경 2km
  }

  // try-catch 제거하고 바로 리턴
  return apiClient.get("/api/items", params);
}

/**
 * 아이템 상세 조회 API
 * 특정 아이템의 상세 정보 반환
 *
 * @param itemId - 아이템 고유 ID
 * @returns 아이템 상세 정보
 */
export async function itemsGetDetailAPI(
  itemId: number,
): Promise<ApiResponse<Item>> {
  return apiClient.get(`/api/items/${itemId}`);
}

/**
 * 아이템 생성 API (Multipart)
 * 새로운 아이템 등록 (이미지 업로드 포함)
 *
 * @param formData - FormData 인스턴스 (JSON 데이터 + 이미지 파일)
 * @returns 생성된 아이템 정보
 */
export async function createExchangeItem(
  formData: FormData,
): Promise<ApiResponse<Item>> {
  const response = await apiClient.post("/api/items", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => {
      // Axios가 React Native의 FormData 객체를 문자열로 파괴하는 것을 방지
      return data;
    },
  });
  return response.data;
}

/**
 * 아이템 수정 API
 * 기존 아이템 정보 업데이트
 *
 * @param itemId - 아이템 고유 ID
 * @param request - 아이템 수정 요청 데이터
 * @returns 수정된 아이템 정보
 */
export async function itemsUpdateAPI(
  itemId: number,
  request: UpdateItemRequest,
): Promise<ApiResponse<Item>> {
  return apiClient.patch(`/api/items/${itemId}`, request);
}

/**
 * 아이템 삭제 API
 * 특정 아이템 삭제
 *
 * @param itemId - 아이템 고유 ID
 * @returns 삭제 처리 결과
 */
export async function itemsDeleteAPI(
  itemId: number,
): Promise<ApiResponse<void>> {
  return apiClient.delete(`/api/items/${itemId}`);
}

/**
 * 내 아이템 목록 조회 API
 * 현재 로그인한 사용자가 등록한 아이템 목록
 *
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 20)
 * @returns 페이징 처리된 내 아이템 목록
 */
export async function itemsGetMyItemsAPI(
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<any>> {
  return apiClient.get("/api/items/my", { page, size });
}

/**
 * 아이템 검색 API
 * 키워드로 아이템 검색
 *
 * @param keyword - 검색 키워드
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 20)
 * @returns 페이징 처리된 검색 결과
 */
export async function itemsSearchAPI(
  keyword: string,
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<any>> {
  return apiClient.get("/api/items/search", { keyword, page, size });
}

/**
 * 사용자 위치 업데이트 API
 * 실시간 위치 정보 업데이트
 *
 * @param location - 사용자 위치 정보
 * @returns 위치 업데이트 결과
 */
export async function itemsUpdateLocationAPI(
  location: UserLocation,
): Promise<ApiResponse<void>> {
  return apiClient.post("/api/items/location", location);
}

/**
 * 교환 요청 관련 API 함수 모음
 * 교환 요청 생성, 조회, 상태 변경 등 교환 관리 기능
 */

/**
 * 교환 요청 생성 API
 * 특정 아이템에 대한 교환 요청 생성
 *
 * @param request - 교환 요청 생성 데이터
 * @returns 생성된 교환 요청 정보
 */
export async function exchangeCreateAPI(
  request: CreateExchangeDto,
): Promise<ApiResponse<ExchangeRoomResponseDto>> {
  return apiClient.post("/api/exchanges", request);
}

/**
 * 받은 교환 요청 목록 조회 API
 * 현재 사용자가 받은 모든 교환 요청 목록 반환
 *
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 20)
 * @returns 페이징 처리된 받은 교환 요청 목록
 */
export async function exchangeGetReceivedAPI(
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<ExchangeRequestListResponse>> {
  return apiClient.get("/api/exchanges/receive", { page, size });
}

/**
 * 나의 교환 요청 목록 조회 API (받은 제안 / 보낸 제안)
 * role 파라미터를 통해 분기 (sender: 보낸 제안, receiver: 받은 제안)
 *
 * @param role - 요청자 구분 ('sender' | 'receiver')
 * @param page - 페이지 번호
 * @param size - 페이지 크기
 * @param status - (옵션) 상태 필터 문자열
 */
export async function exchangeGetMyRequestsAPI(
  role: "sender" | "receiver",
  page: number = 0,
  size: number = 20,
  status?: string,
): Promise<ApiResponse<ExchangeRequestListResponse>> {
  const params: Record<string, any> = { role, page, size };
  if (status) params.status = status;
  return apiClient.get("/api/exchanges/my", params);
}

/**
 * 교환 요청 상태 업데이트 API
 * 교환 요청을 수락 또는 거절 처리
 *
 * @param exchangeRequestId - 교환 요청 고유 ID
 * @param request - 상태 변경 요청 데이터
 * @returns 상태 변경 처리 결과
 */
export async function exchangeUpdateStatusAPI(
  exchangeRequestId: number,
  request: UpdateExchangeStatusDto,
): Promise<ApiResponse<ExchangeRoomResponseDto>> {
  return apiClient.patch(`/api/exchanges/${exchangeRequestId}`, request);
}

/**
 * 아이템 상태 변경 API
 * 아이템의 상태를 변경 (예: REGISTERED -> EXCHANGE_RESERVED)
 *
 * @param itemId - 아이템 고유 ID
 * @param status - 변경할 상태
 * @returns 상태 변경 처리 결과
 */
export async function itemsUpdateStatusAPI(
  itemId: number,
  status: string,
): Promise<ApiResponse<void>> {
  return apiClient.patch(`/api/items/${itemId}/status`, { status });
}

/**
 * 활성 아이템 존재 여부 확인 API
 * 현재 로그인한 사용자가 등록한 아이템 중 'REGISTERED' 상태인 아이템이 있는지 확인
 * 
 * @returns 활성 아이템 존재 여부 (true/false)
 */
export async function checkHasActiveItemAPI(): Promise<ApiResponse<boolean>> {
  return apiClient.get("/api/items/check-active");
}
