/**
 * 티켓 예매 알림 관련 타입 정의
 */

export interface TicketAlarm {
  alarmId: number;
  minusBefore: number;
  alarmTime: string; // ISO String
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchTime: string; // ISO String
  stadiumName: string;
  bookingPolicyId: number;
  membership: string | null;
  ticketUrl: string | null;
  openBookingTime: string; // ISO String
}

export interface CreateTicketAlarmRequest {
  matchId: number;
  teamId: number; // 응원팀 ID
  preAlarmTime: number; // 1~180분
  membership?: string;
}

export interface UpdateTicketAlarmRequest {
  preAlarmTime?: number;
  membership?: string;
}

export interface TicketAlarmPageResponse {
  content: TicketAlarm[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
