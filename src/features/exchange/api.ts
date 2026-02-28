import { apiClient } from "@/src/core/client";
import type { ApiResponse } from "@/src/shared/types/common";
import axios from "axios";
import {
  CreateExchangeDto,
  CreateItemRequest,
  ExchangeRequestListResponse,
  Item,
  ItemCategory,
  UpdateExchangeStatusDto,
  UserLocation,
} from "./types";

/**
 * 아이템 관련 API 함수 모음
 * 아이템 등록, 조회, 검색 등 아이템 관리 기능
 */

/**
 * 아이템 목록 조회 API
 * 모든 아이템 목록을 페이징 처리하여 반환
 *
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 20)
 * @param category - 아이템 카테고리 필터 (선택사항)
 * @param status - 아이템 상태 필터 (선택사항)
 * @returns 페이징 처리된 아이템 목록
 */
export async function itemsGetListAPI(
  page: number = 0,
  size: number = 20,
  category?: ItemCategory,
  status?: string,
): Promise<ApiResponse<any>> {
  const params: any = { page, size };
  if (category) params.category = category;
  if (status) params.status = status;

  // try-catch 제거하고 바로 리턴
  return apiClient.get("/api/v1/items", params);
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
  return apiClient.get(`/api/v1/items/${itemId}`);
}

/**
 * 아이템 생성 API
 * 새로운 아이템 등록
 *
 * @param request - 아이템 생성 요청 데이터
 * @returns 생성된 아이템 정보
 */
export async function itemsCreateAPI(
  request: CreateItemRequest,
): Promise<ApiResponse<Item>> {
  try {
    // 백엔드 CreateItemWithLocationRequestDto 스펙에 맞게 페이로드 재구성
    const payload = {
      itemDto: {
        category: request.itemCategory, // ItemCategory enum (GOODS, TICKET)
        title: request.title,
        seatInfo: null, // 선택적 필드, 현재는 null로 전송
        description: request.description,
      },
      locationDto: {
        latitude: Number(request.location.latitude), // double 타입 명시적 변환
        longitude: Number(request.location.longitude), // double 타입 명시적 변환
      },
    };

    const response = await apiClient.post("/api/v1/items", payload);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("🚨 [아이템 등록 400 에러 RAW DATA] 🚨");
      console.error("- Status:", error.response?.status);
      // 백엔드가 어떤 필드에서 유효성 검사가 실패했는지 알려주는 errors 배열 출력
      console.error("- Data:", JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error("🚨 [알 수 없는 에러]:", error);
    }
    throw error;
  }
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
  request: Partial<CreateItemRequest>,
): Promise<ApiResponse<Item>> {
  return apiClient.patch(`/api/v1/items/${itemId}`, request);
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
  return apiClient.delete(`/api/v1/items/${itemId}`);
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
  return apiClient.get("/api/v1/items/my", { page, size });
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
  return apiClient.get("/api/v1/items/search", { keyword, page, size });
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
  return apiClient.post("/api/v1/items/location", location);
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
): Promise<ApiResponse<void>> {
  return apiClient.post("/api/v1/exchanges", request);
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
  return apiClient.get("/api/v1/exchanges/receive", { page, size });
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
): Promise<ApiResponse<void>> {
  return apiClient.patch(`/api/v1/exchanges/${exchangeRequestId}`, request);
}

/**
 * 교환 완료 처리 API
 * 교환이 성공적으로 완료되었음을 표시
 *
 * @param exchangeRequestId - 교환 요청 고유 ID
 * @returns 교환 완료 처리 결과
 */
export async function exchangeCompleteAPI(
  exchangeRequestId: number,
): Promise<ApiResponse<void>> {
  return apiClient.patch(`/api/v1/exchanges/${exchangeRequestId}/complete`);
}
