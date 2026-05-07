import { apiClient } from "@/src/core/client";
import { MatchScheduleResponse } from "./types";

/**
 * 경기 일정 관련 API 호출 함수
 *
 * Why: 특정 화면(Home)에 종속되지 않는 공통 Match 도메인 API.
 */
export const fetchMatchScheduleAPI = async (year: number, month: number) => {
  return await apiClient.get<MatchScheduleResponse>("/api/matches/schedule", {
    year,
    month,
  });
};
