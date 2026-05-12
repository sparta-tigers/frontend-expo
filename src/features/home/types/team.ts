// src/features/home/types/team.ts
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
