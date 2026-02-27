/**
 * 티켓 알림 관련 타입 정의
 * 백엔드 TicketAlarm 스펙 매칭
 */

/**
 * 티켓 알림 정보 모델
 * 백엔드 TicketAlarmResponseDto 스펙 매칭
 */
export interface TicketAlarm {
  id: number;
  userId: number;
  stadiumName: string;
  gameDate: string; // ISO 8601 형식
  opponentTeam: string;
  isNotified: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 티켓 알림 생성 요청 모델
 * 백엔드 AddTicketAlarmRequestDto 스펙 매칭
 */
export interface AddTicketAlarmRequest {
  stadiumName: string;
  gameDate: string; // ISO 8601 형식 (YYYY-MM-DD)
  opponentTeam: string;
}

/**
 * 티켓 알림 수정 요청 모델
 * 백엔드 UpdateTicketAlarmRequestDto 스펙 매칭
 */
export interface UpdateTicketAlarmRequest {
  stadiumName: string;
  gameDate: string; // ISO 8601 형식 (YYYY-MM-DD)
  opponentTeam: string;
  isNotified: boolean;
}

/**
 * 경기장 목록 상수
 * 실제 프로젝트에서는 백엔드에서 제공하는 경기장 목록 API 사용 권장
 */
export const STADIUMS = [
  { name: "잠실 야구장", location: "서울" },
  { name: "고척 스카이돔", location: "서울" },
  { name: "Jamsil Baseball Stadium", location: "Seoul" },
  { name: "Gocheok Sky Dome", location: "Seoul" },
  { name: "사직 야구장", location: "부산" },
  { name: "Sajik Baseball Stadium", location: "Busan" },
  { name: "대구 삼성 라이온즈 파크", location: "대구" },
  { name: "Daegu Samsung Lions Park", location: "Daegu" },
  { name: "창원 NC 파크", location: "창원" },
  { name: "Changwon NC Park", location: "Changwon" },
] as const;

/**
 * 알림 상태 Enum
 */
export enum NotificationStatus {
  NOTIFIED = "NOTIFIED",
  PENDING = "PENDING",
}
