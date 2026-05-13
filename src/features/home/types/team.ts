// src/features/home/types/team.ts
/**
 * 팀(구단) 정보 데이터 모델
 *
 * Why: 대시보드, 순위표, 라인업 등 앱 전반에서 사용되는 구단의 기본 정보를 정의하기 위함.
 * 백엔드 데이터와 UI 렌더링에 필요한 스타일 정보를 포함합니다.
 */
export interface TeamDto {
  /** 팀 전체 명칭 (예: "KIA 타이거즈") */
  name: string;
  /** 팀 약칭 (예: "KIA") */
  shortName: string;
  /** 팀 서브 명칭 (예: "타이거즈") */
  subName: string;
  /** 팀 마스코트 이모지 (예: "🐯") */
  mascotEmoji: string;
  /** 팀 고유 컬러 (Hex) */
  color: string;
  /** 백엔드 매핑 코드 (예: "HT", "OB") */
  backendCode: string;
}
