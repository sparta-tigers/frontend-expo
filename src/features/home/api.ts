/**
 * 홈 피처 관련 API 클라이언트
 */

import { apiClient } from "@/src/core/client";
import type { ApiResponse } from "@/src/shared/types/common";
import { HomeDashboardSummaryDto } from "./types";

/**
 * 홈 대시보드 요약 데이터 조회 API
 * GET /api/dashboard/summary
 */
export async function fetchDashboardSummary(): Promise<ApiResponse<HomeDashboardSummaryDto>> {
  return apiClient.get<ApiResponse<HomeDashboardSummaryDto>>("/api/dashboard/summary");
}
