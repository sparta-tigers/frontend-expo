import { apiClient } from "@/src/core/client";
import { ApiResponse } from "@/src/shared/types/common";
import { CreateItemRequest, Item, ItemCategory, UserLocation } from "./types";

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
  return apiClient.post("/api/v1/items", request);
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
  return apiClient.put(`/api/v1/items/${itemId}`, request);
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
