import { apiClient } from "@/src/core/client";
import type { ApiResponse, PaginatedResponse } from "@/src/shared/types/common";
import {
  MatchAttendance,
  TicketOcrResponseDto,
} from "./types";

/**
 * 🚨 앙드레 카파시: 직관 기록(Match Attendance) API 정의
 * 
 * Why: 백엔드 MatchAttendanceController와 통신하며, 
 * Multipart/form-data 처리를 위해 Axios 설정을 명시적으로 제어함.
 */

/**
 * 내 직관 기록 목록 조회 API
 * 
 * @param page - 페이지 번호 (1-indexed)
 * @param size - 페이지 크기
 */
export async function attendanceGetMyAPI(
  page: number = 1,
  size: number = 10,
): Promise<ApiResponse<PaginatedResponse<MatchAttendance>>> {
  return apiClient.get("/api/attendances/my", { page, size });
}

/**
 * 직관 기록 상세 조회 API
 */
export async function attendanceGetDetailAPI(
  attendanceId: number,
): Promise<ApiResponse<MatchAttendance>> {
  return apiClient.get(`/api/attendances/${attendanceId}`);
}

/**
 * 직관 기록 생성 API (Multipart)
 * 
 * @param formData - request(JSON Blob)와 images(Files)를 포함한 FormData
 */
export async function attendanceCreateAPI(
  formData: FormData,
): Promise<ApiResponse<MatchAttendance>> {
  return apiClient.post("/api/attendances", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => data, // RN FormData 보존
  });
}

/**
 * 직관 기록 수정 API (Multipart)
 */
export async function attendanceUpdateAPI(
  attendanceId: number,
  formData: FormData,
): Promise<ApiResponse<MatchAttendance>> {
  return apiClient.patch(`/api/attendances/${attendanceId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => data,
  });
}

/**
 * 직관 기록 삭제 API
 */
export async function attendanceDeleteAPI(
  attendanceId: number,
): Promise<ApiResponse<void>> {
  return apiClient.delete(`/api/attendances/${attendanceId}`);
}

/**
 * 티켓 OCR 및 임시 업로드 API
 */
export async function attendanceOcrAPI(
  formData: FormData,
): Promise<ApiResponse<TicketOcrResponseDto>> {
  return apiClient.post("/api/attendances/ticket", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => data,
  });
}
