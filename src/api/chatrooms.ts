import { apiClient, ApiResponse } from "./index";
import {
  ChatMessageListResponse,
  CreateDirectRoomRequest,
  DirectRoomListResponse,
  SendMessageRequest,
} from "./types/chatrooms";

/**
 * 채팅방 관련 API 함수 모음
 * 1:1 채팅방 관리, 메시지 전송/조회 기능
 */

/**
 * 채팅방 목록 조회 API
 * 현재 사용자가 속한 모든 1:1 채팅방 목록 반환
 *
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 10)
 * @returns 페이징 처리된 채팅방 목록
 */
export async function chatroomsGetListAPI(
  page: number = 0,
  size: number = 10,
): Promise<ApiResponse<DirectRoomListResponse>> {
  return apiClient.get("/api/direct-rooms", { page, size });
}

/**
 * 1:1 채팅방 생성 API
 * 교환 요청을 기반으로 새로운 채팅방 생성
 *
 * @param request - 채팅방 생성 요청 데이터
 * @returns 생성된 채팅방 정보
 */
export async function chatroomsCreateDirectRoomAPI(
  request: CreateDirectRoomRequest,
): Promise<ApiResponse<any>> {
  return apiClient.post("/api/direct-rooms", request);
}

/**
 * 채팅 메시지 목록 조회 API
 * 특정 채팅방의 모든 메시지 히스토리 반환
 *
 * @param roomId - 채팅방 고유 ID
 * @param page - 페이지 번호 (기본값: 0)
 * @param size - 페이지당 데이터 크기 (기본값: 50)
 * @returns 페이징 처리된 메시지 목록
 */
export async function chatroomsGetMessagesAPI(
  roomId: number,
  page: number = 0,
  size: number = 50,
): Promise<ApiResponse<ChatMessageListResponse>> {
  return apiClient.get(`/api/direct-rooms/${roomId}/messages`, { page, size });
}

/**
 * 채팅 메시지 전송 API
 * WebSocket을 통한 실시간 메시지 전송
 *
 * @param request - 메시지 전송 요청 데이터
 * @returns 메시지 전송 결과
 */
export async function chatroomsSendMessageAPI(
  request: SendMessageRequest,
): Promise<ApiResponse<void>> {
  return apiClient.post("/api/chat/send", request);
}
