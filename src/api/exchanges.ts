import { apiClient, ApiResponse } from "./index";
import {
  ExchangeRequestListResponse,
  ExchangeRequestRequest,
  UpdateExchangeRequestRequest,
} from "./types/exchanges";

/**
 * 교환 요청 관련 API 함수 모음
 * 아이템 교환 신청, 조회, 상태 변경 기능
 */

/**
 * 교환 요청 생성 API
 * 특정 아이템에 대한 교환 신청
 *
 * @param request - 교환 요청 생성 데이터
 * @returns 생성된 교환 요청 정보
 */
export async function exchangesCreateRequestAPI(
  request: ExchangeRequestRequest,
): Promise<ApiResponse<any>> {
  return apiClient.post("/api/v1/exchanges", request);
}

/**
 * 받은 교환 요청 목록 조회 API
 * 현재 사용자가 받은 모든 교환 요청 목록
 *
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 10)
 * @returns 페이징 처리된 받은 교환 요청 목록
 */
export async function exchangesGetReceivedRequestsAPI(
  page: number = 0,
  size: number = 10,
): Promise<ApiResponse<ExchangeRequestListResponse>> {
  return apiClient.get("/api/v1/exchanges/received", { page, size });
}

/**
 * 보낸 교환 요청 목록 조회 API
 * 현재 사용자가 보낸 모든 교환 요청 목록
 *
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 10)
 * @returns 페이징 처리된 보낸 교환 요청 목록
 */
export async function exchangesGetSentRequestsAPI(
  page: number = 0,
  size: number = 10,
): Promise<ApiResponse<ExchangeRequestListResponse>> {
  return apiClient.get("/api/v1/exchanges/sent", { page, size });
}

/**
 * 교환 요청 상태 변경 API
 * 교환 요청 수락 또는 거절
 *
 * @param requestId - 교환 요청 고유 ID
 * @param request - 상태 변경 요청 데이터
 * @returns 수정된 교환 요청 정보
 */
export async function exchangesUpdateRequestAPI(
  requestId: number,
  request: UpdateExchangeRequestRequest,
): Promise<ApiResponse<any>> {
  return apiClient.patch(`/api/v1/exchanges/${requestId}`, request);
}

/**
 * 교환 요청 삭제 API
 * 교환 요청 취소 또는 삭제
 *
 * @param requestId - 교환 요청 고유 ID
 * @returns 삭제 처리 결과
 */
export async function exchangesDeleteRequestAPI(
  requestId: number,
): Promise<ApiResponse<void>> {
  return apiClient.delete(`/api/v1/exchanges/${requestId}`);
}
