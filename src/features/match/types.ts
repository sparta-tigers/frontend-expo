import type { 
  MatchScheduleDto, 
  RankingRowDto,
} from "@/src/shared/types/match";

/**
 * Match 도메인 전용 타입 확장
 * 
 * Why: shared에서 정의된 핵심 타입을 기반으로 match 피처에서 필요한
 * 추가적인 API 응답 구조 등을 정의함.
 */

export interface MatchScheduleResponse {
  resultType: "SUCCESS" | "ERROR";
  data: MatchScheduleDto[];
  message?: string;
}

export interface TeamRankingResponse {
  resultType: "SUCCESS" | "ERROR";
  data: RankingRowDto[];
  message?: string;
}
