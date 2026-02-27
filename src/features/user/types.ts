/**
 * 즐겨찾기 팀 관련 타입 정의
 * 백엔드 FavoriteTeam 스펙 매칭
 */

/**
 * 즐겨찾기 팀 정보 모델
 * 백엔드 FavoriteTeamResponseDto 스펙 매칭
 */
export interface FavoriteTeam {
  id: number;
  userId: number;
  teamName: string;
  teamCode: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 즐겨찾기 팀 생성 요청 모델
 * 백엔드 AddFavoriteTeamRequestDto 스펙 매칭
 */
export interface AddFavoriteTeamRequest {
  teamName: string;
  teamCode: string;
}

/**
 * 즐겨찾기 팀 수정 요청 모델
 * 백엔드 UpdateFavoriteTeamRequestDto 스펙 매칭
 */
export interface UpdateFavoriteTeamRequest {
  teamName: string;
  teamCode: string;
}

/**
 * KBO 팀 목록 상수
 * 실제 프로젝트에서는 백엔드에서 제공하는 팀 목록 API 사용 권장
 */
export const KBO_TEAMS = [
  { name: "두산 베어스", code: "OB" },
  { name: "LG 트윈스", code: "LG" },
  { name: "KT 위즈", code: "KT" },
  { name: "SK 와이번스", code: "SK" },
  { name: "NC 다이노스", code: "NC" },
  { name: "KIA 타이거즈", code: "HT" },
  { name: "한화 이글스", code: "HH" },
  { name: "롯데 자이언츠", code: "LT" },
  { name: "삼성 라이온즈", code: "SS" },
  { name: "키움 히어로즈", code: "WO" },
] as const;

export type KboTeamCode = typeof KBO_TEAMS[number]["code"];
