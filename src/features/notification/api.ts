/**
 * 티켓 알림 관련 API 클라이언트
 * 백엔드 TicketAlarm 컨트롤러와 연동
 */

import { apiClient } from "@/src/core/client";
import type { ApiResponse } from "@/src/shared/types/common";
import {
  TicketAlarm,
  AddTicketAlarmRequest,
  UpdateTicketAlarmRequest,
} from "./types";

/**
 * 티켓 알림 추가 API
 * POST /api/ticketalarm
 *
 * @param request - 티켓 알림 추가 요청 데이터
 * @returns 추가된 티켓 알림 정보
 */
export async function ticketAlarmAddAPI(
  request: AddTicketAlarmRequest,
): Promise<ApiResponse<TicketAlarm>> {
  return apiClient.post("/api/ticketalarm", request);
}

/**
 * 내 티켓 알림 목록 조회 API
 * GET /api/ticketalarm
 *
 * @returns 내 티켓 알림 목록
 */
export async function ticketAlarmGetListAPI(): Promise<
  ApiResponse<TicketAlarm[]>
> {
  return apiClient.get("/api/ticketalarm");
}

/**
 * 티켓 알림 수정 API
 * PATCH /api/ticketalarm/{alarmId}
 *
 * @param alarmId - 티켓 알림 고유 ID
 * @param request - 티켓 알림 수정 요청 데이터
 * @returns 수정된 티켓 알림 정보
 */
export async function ticketAlarmUpdateAPI(
  alarmId: number,
  request: UpdateTicketAlarmRequest,
): Promise<ApiResponse<TicketAlarm>> {
  return apiClient.patch(`/api/ticketalarm/${alarmId}`, request);
}

/**
 * 티켓 알림 삭제 API
 * DELETE /api/ticketalarm/{alarmId}
 *
 * @param alarmId - 티켓 알림 고유 ID
 * @returns 삭제 처리 결과
 */
export async function ticketAlarmDeleteAPI(
  alarmId: number,
): Promise<ApiResponse<void>> {
  return apiClient.delete(`/api/ticketalarm/${alarmId}`);
}
