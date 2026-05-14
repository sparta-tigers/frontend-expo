/**
 * 라인업 항목 데이터 모델
 * 
 * Why: 홈 대시보드와 라이브보드 상세 화면에서 공통으로 사용되는 선수 라인업 규격.
 * 특정 피처에 종속되지 않도록 shared 레이어에서 관리함.
 */
export interface LineupRowDto {
  /** 타순 (예: "1", "2") */
  battingOrder: string;
  /** 선수 이름 */
  name: string;
  /** 수비 포지션 (예: "DH", "CF") */
  position: string;
  /** 안타 수 (실시간) */
  hits?: number;
  /** 타점 (실시간) */
  rbis?: number;
}
