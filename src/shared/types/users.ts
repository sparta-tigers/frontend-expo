/**
 * 사용자 관련 타입 정의
 * 회원가입, 사용자 정보 등 사용자 도메인 데이터 구조
 */

/**
 * 회원가입 요청 데이터 인터페이스
 * 신규 사용자 생성에 필요한 정보
 * Java의 UserRegisterRequest DTO와 동일한 역할
 */
export interface UserRegisterRequest {
  /** 사용자 이메일 주소 */
  email: string;
  /** 사용자 닉네임 */
  nickname: string;
  /** 사용자 비밀번호 */
  password: string;
}

/**
 * 사용자 정보 인터페이스
 * 시스템 내 사용자의 기본 정보
 * Java의 User Response DTO와 동일한 역할
 */
export interface User {
  /** 사용자 고유 ID */
  userId: number;
  /** 사용자 이메일 주소 */
  email: string;
  /** 사용자 닉네임 */
  nickname: string;
  /** 프로필 이미지 URL (선택사항) */
  profileImageUrl?: string | null;
  /** 사용자 역할 (예: USER, ADMIN) */
  role?: string;
  /** 관심 주제 (선택사항) */
  subject?: string;
}

/**
 * 사용자 프로필 수정 요청 인터페이스
 * 사용자 정보 업데이트에 필요한 데이터
 */
export interface UserProfileUpdateRequest {
  /** 수정할 닉네임 (선택사항) */
  nickname?: string;
  /** 수정할 프로필 이미지 URL (선택사항) */
  profileImageUrl?: string;
  /** 관심 주제 (선택사항) */
  subject?: string;
}
