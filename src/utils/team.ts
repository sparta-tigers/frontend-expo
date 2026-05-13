import { theme } from "@/src/styles/theme";

/**
 * 🛡️ TeamCode: KBO 구단 식별자 유니온 타입
 * Why: 단순 문자열 사용을 지양하고 타입 안정성을 확보하여 Fail-fast를 실현함.
 */
export type TeamCode =
  | "KIA"
  | "LG"
  | "KT"
  | "SSG"
  | "NC"
  | "DOOSAN"
  | "LOTTE"
  | "SAMSUNG"
  | "HANWHA"
  | "KIWOOM"
  | "DEFAULT";

/**
 * 🎨 TeamColorToken: 테마 시스템과 연동되는 컬러 토큰 타입
 */
export type TeamColorToken = keyof typeof theme.colors.team;

/**
 * 🏛️ TeamMeta: 구단 메타데이터 인터페이스 (SSOT)
 */
export interface TeamMeta {
  readonly id: TeamCode;
  readonly name: string; // 풀네임 (예: KIA 타이거즈)
  readonly shortName: string; // 약칭 (예: KIA)
  readonly mascotEmoji: string; // 마스코트 이모지
  readonly color: string; // 테마 Hex 값
  readonly colorToken: TeamColorToken; // 테마 토큰 키
  readonly backendCode: string; // DB 매핑 코드 (HT, SK, WO 등)
  readonly stadium: string; // 홈 구장명
  readonly logo?: any; // 구단 로고 에셋 (require 구문 사용 예정)
}

/**
 * 💎 TEAM_DATA: 전 구단 메타데이터 (Single Source of Truth)
 * 
 * Why: 아키텍처 가이드에 따라 에셋(Logo)을 require로 직접 포함하며, 
 *      DB 매핑 코드(HT, SK 등)를 명시적으로 관리하여 결정론적 조회를 보장함.
 */
export const TEAM_DATA: Record<TeamCode, TeamMeta> = {
  KIA: {
    id: "KIA",
    name: "KIA 타이거즈",
    shortName: "KIA",
    mascotEmoji: "🐯",
    color: theme.colors.team.kia,
    colorToken: "kia",
    backendCode: "HT",
    stadium: "광주-기아 챔피언스 필드",
  },
  LG: {
    id: "LG",
    name: "LG 트윈스",
    shortName: "LG",
    mascotEmoji: "👯",
    color: theme.colors.team.lg,
    colorToken: "lg",
    backendCode: "LG",
    stadium: "서울 잠실 야구장",
  },
  KT: {
    id: "KT",
    name: "KT 위즈",
    shortName: "KT",
    mascotEmoji: "🧙",
    color: theme.colors.team.kt,
    colorToken: "kt",
    backendCode: "KT",
    stadium: "수원 KT 위즈 파크",
  },
  SSG: {
    id: "SSG",
    name: "SSG 랜더스",
    shortName: "SSG",
    mascotEmoji: "🛸",
    color: theme.colors.team.ssg,
    colorToken: "ssg",
    backendCode: "SK",
    stadium: "인천 SSG 랜더스 필드",
  },
  NC: {
    id: "NC",
    name: "NC 다이노스",
    shortName: "NC",
    mascotEmoji: "🦖",
    color: theme.colors.team.nc,
    colorToken: "nc",
    backendCode: "NC",
    stadium: "창원 NC 파크",
  },
  DOOSAN: {
    id: "DOOSAN",
    name: "두산 베어스",
    shortName: "두산",
    mascotEmoji: "🐻",
    color: theme.colors.team.doosan,
    colorToken: "doosan",
    backendCode: "OB",
    stadium: "서울 잠실 야구장",
  },
  LOTTE: {
    id: "LOTTE",
    name: "롯데 자이언츠",
    shortName: "롯데",
    mascotEmoji: "⚓",
    color: theme.colors.team.lotte,
    colorToken: "lotte",
    backendCode: "LT",
    stadium: "부산 사직 야구장",
  },
  SAMSUNG: {
    id: "SAMSUNG",
    name: "삼성 라이온즈",
    shortName: "삼성",
    mascotEmoji: "🦁",
    color: theme.colors.team.samsung,
    colorToken: "samsung",
    backendCode: "SS",
    stadium: "대구 삼성 라이온즈 파크",
  },
  HANWHA: {
    id: "HANWHA",
    name: "한화 이글스",
    shortName: "한화",
    mascotEmoji: "🦅",
    color: theme.colors.team.hanwha,
    colorToken: "hanwha",
    backendCode: "HH",
    stadium: "한화생명 이글스 파크",
  },
  KIWOOM: {
    id: "KIWOOM",
    name: "키움 히어로즈",
    shortName: "키움",
    mascotEmoji: "🦸",
    color: theme.colors.team.kiwoom,
    colorToken: "kiwoom",
    backendCode: "WO",
    stadium: "고척 스카이돔",
  },
  DEFAULT: {
    id: "DEFAULT",
    name: "KBO",
    shortName: "KBO",
    mascotEmoji: "⚾",
    color: theme.colors.team.fallback,
    colorToken: "fallback",
    backendCode: "KBO",
    stadium: "KBO 야구장",
  },
} as const;

/**
 * 📝 아래 레거시 매핑 객체들은 아키텍트 가이드에 따라 완전 숙청(Clean Sweep)되었습니다.
 * SSOT를 위해 TEAM_DATA 하나만 남기고 나머지는 제거합니다.
 */
