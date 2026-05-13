import { apiClient } from "@/src/core/client";
import type { ApiResponse, PaginatedResponse } from "@/src/shared/types/common";
import { 
  TicketAlarm, 
  CreateTicketAlarmRequest, 
  UpdateTicketAlarmRequest 
} from "./types";

/**
 * 🚨 앙드레 카파시: 티켓 예매 알림 API 정의
 * 
 * Why: 백엔드 TicketAlarmController와 통신하며, 
 * 모든 엔드포인트(생성, 목록 조회, 수정, 삭제)를 명시적으로 처리함.
 */

/**
 * 내 티켓 알림 목록 조회 API
 */
export async function ticketAlarmGetListAPI(
  page: number = 1,
  size: number = 10,
): Promise<ApiResponse<PaginatedResponse<TicketAlarm>>> {
  return apiClient.get("/api/ticketalarm", { page, size });
}

/**
 * 티켓 알림 생성 API
 */
export async function ticketAlarmCreateAPI(
  request: CreateTicketAlarmRequest,
): Promise<ApiResponse<TicketAlarm>> {
  return apiClient.post("/api/ticketalarm", request);
}

/**
 * 티켓 알림 수정 API
 */
export async function ticketAlarmUpdateAPI(
  alarmId: number,
  request: UpdateTicketAlarmRequest,
): Promise<ApiResponse<TicketAlarm>> {
  return apiClient.patch(`/api/ticketalarm/${alarmId}`, request);
}

/**
 * 티켓 알림 삭제 API
 */
export async function ticketAlarmDeleteAPI(
  alarmId: number,
): Promise<ApiResponse<void>> {
  return apiClient.delete(`/api/ticketalarm/${alarmId}`);
}
