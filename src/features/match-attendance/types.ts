/**
 * 🚨 앙드레 카파시: 직관 기록(Match Attendance) 관련 타입 정의
 * 
 * Why: 백엔드 DTO(MatchAttendanceResponseDto, MatchAttendanceRequestDto)와 1:1 매핑하여
 * 타입 안정성을 확보하고 런타임 에러를 방지함.
 */

export interface AttendanceImage {
  id: number;
  imageUrl: string;
}

export interface MatchAttendance {
  id: number;
  matchId: number;
  seat: string;
  contents: string;
  imageUrls: string[];
  createdAt: string;
  matchTime: string; // 🚨 추가
  homeTeamName: string; // 🚨 추가
  awayTeamName: string; // 🚨 추가
  homeTeamCode: string; // 🚨 추가
  awayTeamCode: string; // 🚨 추가
}

/**
 * 직관 기록 생성 요청 DTO
 */
export interface MatchAttendanceRequestDto {
  matchId: number;
  seat: string;
  contents?: string;
  // 이미지는 MultipartFile로 별도 전송하므로 여기서는 누락하거나 빈 배열 처리 가능
  imageUrls?: string[]; 
}

/**
 * 직관 기록 수정 요청 DTO
 */
export interface MatchAttendanceUpdateRequestDto {
  seat?: string;
  contents?: string;
  oldImageUrls?: string[]; // 유지할 기존 이미지 URL들
}

/**
 * 티켓 OCR 응답 DTO
 */
export interface TicketOcrResponseDto {
  imageUrl: string;
  seat: string;
}
