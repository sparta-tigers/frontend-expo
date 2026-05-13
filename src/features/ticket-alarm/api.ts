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
 * 🔍 ticketAlarmGetListAPI: 사용자의 티켓 예매 알림 목록을 페이징하여 조회합니다.
 * 
 * Why: 사용자가 설정한 전체 알림 내역을 관리 화면이나 대시보드 요약 UI에서 렌더링하기 위함. 
 * 무한 스크롤이나 페이지네이션 구현 시, 백엔드로부터 필요한 만큼의 데이터만 가져와 메모리 효율성을 확보합니다.
 */
export async function ticketAlarmGetListAPI(
  page: number = 1,
  size: number = 10,
): Promise<ApiResponse<PaginatedResponse<TicketAlarm>>> {
  return apiClient.get("/api/ticketalarm", { page, size });
}

/**
 * 📡 ticketAlarmCreateAPI: 새로운 티켓 예매 알림을 서버에 등록합니다.
 * 
 * Why: 특정 경기(matchId)에 대해 사용자가 원하는 시점에 알림을 받을 수 있도록 백엔드 스케줄러에 등록하기 위함. 
 * 생성 성공 시 반환되는 alarmId를 통해 클라이언트 캘린더 UI 등에 즉각적인 상태 반영이 가능해집니다.
 */
export async function ticketAlarmCreateAPI(
  request: CreateTicketAlarmRequest,
): Promise<ApiResponse<TicketAlarm>> {
  return apiClient.post("/api/ticketalarm", request);
}

/**
 * 🛠 ticketAlarmUpdateAPI: 기존에 설정된 알림의 설정값(시점, 멤버십 등)을 수정합니다.
 * 
 * Why: 알림 엔티티 전체를 새로 생성하는 대신, HTTP PATCH를 통해 변경이 필요한 필드만 
 * 부분적으로 갱신하여 네트워크 대역폭을 절약하고 서버 측 엔티티의 불필요한 필드 덮어쓰기를 방지합니다.
 */
export async function ticketAlarmUpdateAPI(
  alarmId: number,
  request: UpdateTicketAlarmRequest,
): Promise<ApiResponse<TicketAlarm>> {
  return apiClient.patch(`/api/ticketalarm/${alarmId}`, request);
}

/**
 * 🗑 ticketAlarmDeleteAPI: 설정된 알림을 삭제하고 백엔드 알림 스케줄을 해제합니다.
 * 
 * Why: 사용자의 명시적인 알림 취소 액션에 대응하여 서버 자원을 반환하고, 
 * 클라이언트 측에서도 해당 알림과 관련된 UI 요소를 제거하여 데이터 정합성을 유지하기 위함입니다.
 */
export async function ticketAlarmDeleteAPI(
  alarmId: number,
): Promise<ApiResponse<void>> {
  return apiClient.delete(`/api/ticketalarm/${alarmId}`);
}
