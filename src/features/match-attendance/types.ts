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
  images: AttendanceImage[]; // 🚨 imageUrls → images (객체 배열)로 변경
  createdAt: string;
  matchTime: string; // 🚨 추가
  homeTeamName: string; // 🚨 추가
  awayTeamName: string; // 🚨 추가
  homeTeamCode: string; // 🚨 추가
  awayTeamCode: string; // 🚨 추가
  homeScore?: number;
  awayScore?: number;
  stadiumName: string;
}

export interface MatchAttendanceRequestDto {
  matchId: number;
  seat: string;
  contents?: string;
  /** 백엔드 저장 후 반환되는 URL 리스트 (읽기 전용) */
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

/**
 * 🚨 [Zero Magic] React Native FormData 전용 인터페이스
 * Why: RN의 FormData.append()는 표준 브라우저와 달리 uri, name, type 필드를 가진 객체를 허용함.
 * any 사용을 지양하고 타입 안정성을 확보하기 위해 명시적으로 정의.
 */
export interface RNFormDataFile {
  uri: string;
  name: string;
  type: string;
}

export type RNFormDataString = string;
