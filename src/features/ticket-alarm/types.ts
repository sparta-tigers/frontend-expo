/**
 * 티켓 예매 알림 관련 타입 정의
 */

/**
 * 🔔 TicketAlarm: 사용자가 설정한 티켓 예매 알림의 상세 도메인 모델
 * 
 * Why: 백엔드의 TicketAlarmResponseDto 스펙을 클라이언트 도메인 모델로 정의하여, 
 * UI 렌더링에 필요한 모든 필드(예매 시간, 경기 정보, 멤버십 등)를 타입 안전하게 관리하기 위함.
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

/**
 * 📝 CreateTicketAlarmRequest: 알림 생성을 위한 요청 규격
 * 
 * Why: 사용자가 선택한 경기(matchId)와 팀(teamId) 정보를 바탕으로 알림 시점과 멤버십 옵션을 
 * 서버에 전달하기 위한 최소한의 데이터 구조를 정의함.
 */
export interface CreateTicketAlarmRequest {
  matchId: number;
  teamId: number; // 응원팀 ID
  preAlarmTime: number; // 1~180분
  membership?: string;
}

/**
 * 🔄 UpdateTicketAlarmRequest: 기존 알림 정보 수정을 위한 요청 규격
 * 
 * Why: 이미 설정된 알림의 시점이나 멤버십 정보만을 부분적으로 수정(PATCH)할 수 있도록 하여, 
 * 무거운 전체 데이터 전송 없이 효율적인 데이터 갱신을 가능케 함.
 */
export interface UpdateTicketAlarmRequest {
  preAlarmTime?: number;
  membership?: string;
}

/**
 * 🔢 TicketAlarmSort: 페이징 데이터의 정렬 상태 정보
 * 
 * Why: Spring Data JPA의 Sort 객체 스펙을 명시하여, 클라이언트에서 
 * 데이터가 어떤 기준(최신순, 경기일순 등)으로 정렬되었는지 판단하고 UI(정렬 아이콘 등)를 제어하기 위함.
 */
export interface TicketAlarmSort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

/**
 * 📄 TicketAlarmPageable: 서버 측 페이징 설정 정보
 * 
 * Why: 현재 요청된 데이터의 오프셋, 페이지 번호, 크기 등을 포함하여 
 * 이후 추가 데이터 로딩(더 보기, 무한 스크롤) 시 정확한 다음 페이지를 계산하기 위한 근거로 활용함.
 */
export interface TicketAlarmPageable {
  sort: TicketAlarmSort;
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * 📦 TicketAlarmPageResponse: 페이징 처리가 포함된 알림 목록 응답 규격
 * 
 * Why: 대량의 알림 데이터를 효율적으로 처리하기 위해 백엔드 Page 객체 스펙을 그대로 매핑함. 
 * content(실제 데이터)와 pagination 메타데이터를 분리하여 목록 UI와 스크롤 로직을 동기화하기 위함.
 */
export interface TicketAlarmPageResponse {
  content: TicketAlarm[];
  pageable: TicketAlarmPageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: TicketAlarmSort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
