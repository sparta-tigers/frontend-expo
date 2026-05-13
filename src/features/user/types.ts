import { TEAM_LIST, BackendCode } from "@/src/utils/team";

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
  teamCode: BackendCode;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 즐겨찾기 팀 생성 요청 모델
 * 백엔드 AddFavoriteTeamRequestDto 스펙 매칭
 */
export interface AddFavoriteTeamRequest {
  teamName: string;
  teamCode: BackendCode;
}

/**
 * 즐겨찾기 팀 수정 요청 모델
 * 백엔드 UpdateFavoriteTeamRequestDto 스펙 매칭
 */
export interface UpdateFavoriteTeamRequest {
  teamName: string;
  teamCode: BackendCode;
}

/**
 * KBO 팀 목록 상수 (TEAM_LIST 기반 SSOT)
 * Why: 백엔드 코드(HT, OB 등)와 구단명을 매핑하는 유일한 출처.
 */
export const KBO_TEAMS = TEAM_LIST.map(team => ({
  name: team.name,
  code: team.backendCode
}));

export type KboTeamCode = BackendCode;
