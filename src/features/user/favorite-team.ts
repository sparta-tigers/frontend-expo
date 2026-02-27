/**
 * 즐겨찾기 팀 관련 타입 정의
 * 사용자가 즐겨찾는 야구팀 관리 기능
 */

/**
 * 즐겨찾기 팀 정보 인터페이스
 */
export interface FavoriteTeam {
  /** 고유 ID */
  id: number;
  /** 팀 이름 */
  teamName: string;
  /** 팀 코드 (예: LG, KT, SK 등) */
  teamCode: string;
  /** 사용자 ID */
  userId: number;
  /** 등록일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
}

/**
 * 즐겨찾기 팀 추가 요청 인터페이스
 */
export interface AddFavoriteTeamRequest {
  /** 팀 이름 */
  teamName: string;
  /** 팀 코드 */
  teamCode: string;
}

/**
 * 즐겨찾기 팀 수정 요청 인터페이스
 */
export interface UpdateFavoriteTeamRequest {
  /** 팀 이름 */
  teamName: string;
  /** 팀 코드 */
  teamCode: string;
}

/**
 * KBO 리그 팀 목록 (상수)
 */
export const KBO_TEAMS = [
  { name: "LG 트윈스", code: "LG" },
  { name: "KT 위즈", code: "KT" },
  { name: "SK 와이번스", code: "SK" },
  { name: "NC 다이노스", code: "NC" },
  { name: "키움 히어로즈", code: "KIA" },
  { name: "KIA 타이거즈", code: "KIA" },
  { name: "롯데 자이언츠", code: "LOTTE" },
  { name: "삼성 라이온즈", code: "SAMSUNG" },
  { name: "한화 이글스", code: "HANHWA" },
  { name: "SSG 랜더스", code: "SSG" },
] as const;

/**
 * 팀 코드 타입
 */
export type TeamCode = typeof KBO_TEAMS[number]['code'];
