/**
 * Match 관련 데이터 타입 정의
 * 
 * Why: 백엔드 MatchScheduleResponseDto와 구조를 동기화하여 타입 안정성 확보.
 * 도메인 분리 원칙에 따라 features/match에서 공통 관리함.
 */

export interface MatchScheduleDto {
  day: number;           // 경기 일 (1-31)
  opponentCode: string;  // 상대 팀 코드 (예: "LG", "SSG")
  opponentName: string;  // 상대 팀 약칭 (예: "LG", "SSG")
  location: "H" | "A";   // 홈/어웨이 여부
  timeText: string;      // 경기 시작 시간 (HH:mm)
}

export interface MatchScheduleResponse {
  resultType: "SUCCESS" | "ERROR";
  data: MatchScheduleDto[];
  message?: string;
}
