import { apiClient } from "@/src/core/client";
import type { ApiResponse } from "@/src/shared/types/common";
import * as ImageManipulator from "expo-image-manipulator";
import {
  CreateExchangeDto,
  CreateItemRequest,
  ExchangeRequestListResponse,
  Item,
  ItemCategory,
  UpdateExchangeStatusDto,
  UpdateItemRequest,
  UserLocation,
} from "./types";

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
 * @param requestData - 아이템 생성 요청 데이터
 * @param imageUris - 선택된 이미지 URI 배열
 * @returns 생성된 아이템 정보
 */
export async function createExchangeItem(
  requestData: CreateItemRequest,
  imageUris: string[],
): Promise<ApiResponse<Item>> {
  const formData = new FormData();

  // 1. JSON DTO 주입 (Spring Boot @RequestPart("itemRequest") 호환)
  formData.append("itemRequest", {
    string: JSON.stringify(requestData),
    type: "application/json",
  } as any);

  // 2. 이미지 압축 및 주입 (Spring Boot @RequestPart("images") 호환)
  if (imageUris && imageUris.length > 0) {
    for (let i = 0; i < imageUris.length; i++) {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUris[i],
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );

        const filename = manipResult.uri.split("/").pop() || `image_${i}.jpg`;

        formData.append("images", {
          uri: manipResult.uri,
          name: filename,
          type: "image/jpeg",
        } as any);
      } catch (error) {
        console.error(
          `Image compression failed for URI: ${imageUris[i]}`,
          error,
        );
        throw new Error("이미지 처리 중 오류가 발생했습니다.");
      }
    }
  }

  // 3. API 전송
  const response = await apiClient.post("/api/items", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data: any) => {
      // Axios가 RN의 FormData 객체를 변형하지 못하도록 방어
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
): Promise<ApiResponse<void>> {
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
  return apiClient.patch(`/api/exchanges/${exchangeRequestId}`, request);
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
  return apiClient.patch(`/api/exchanges/${exchangeRequestId}/complete`);
}
