import { StyleSheet } from "react-native";
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
 * 🆔 DEFAULT_TEAM_ID: 기본 구단 식별자 (매직 스트링 방지)
 */
export const DEFAULT_TEAM_ID = "DEFAULT";

/**
 * 🔌 BackendCode: DB 및 API 통신용 구단 식별 유니온 타입
 * Why: 백엔드 스펙과의 오차를 방지하고 타입 안정성을 확보함.
 */
export type BackendCode =
  | "HT"
  | "LG"
  | "SK"
  | "WO"
  | "NC"
  | "OB"
  | "LT"
  | "SS"
  | "HH"
  | "KT"
  | "KBO";

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
  readonly subName: string; // 서브 명칭 (예: 타이거즈)
  readonly mascotEmoji: string; // 마스코트 이모지
  readonly color: string; // 테마 Hex 값
  readonly colorToken: TeamColorToken; // 테마 토큰 키
  readonly backendCode: BackendCode; // DB 매핑 코드 (HT, SK, WO 등)
  readonly stadium: string; // 홈 구장명
  readonly logo?: any; // 구단 로고 에셋 (require 구문 사용 예정)
}

/**
 * 💎 TEAM_DATA: 전 구단 메타데이터 (Single Source of Truth)
 */
export const TEAM_DATA: Record<TeamCode, TeamMeta> = {
  KIA: {
    id: "KIA",
    name: "KIA 타이거즈",
    shortName: "KIA",
    subName: "타이거즈",
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
    subName: "트윈스",
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
    subName: "위즈",
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
    subName: "랜더스",
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
    subName: "다이노스",
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
    subName: "베어스",
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
    subName: "자이언츠",
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
    subName: "라이온즈",
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
    subName: "이글스",
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
    subName: "히어로즈",
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
    subName: "KBO",
    mascotEmoji: "⚾",
    color: theme.colors.team.fallback,
    colorToken: "fallback",
    backendCode: "KBO",
    stadium: "KBO 야구장",
  },
} as const;

/**
 * ⚡ O(1) 조회를 위한 내부 매핑 맵 (Internal Lookup Maps)
 */
const BACKEND_CODE_MAP = Object.values(TEAM_DATA).reduce((acc, team) => {
  acc[team.backendCode] = team;
  return acc;
}, {} as Record<string, TeamMeta>);

const NAME_MAP = Object.values(TEAM_DATA).reduce((acc, team) => {
  acc[team.name.toUpperCase()] = team;
  acc[team.shortName.toUpperCase()] = team;
  return acc;
}, {} as Record<string, TeamMeta>);

/**
 * 🔍 findTeamMeta: 구단 식별자를 기반으로 결정론적 메타데이터 반환
 */
export function findTeamMeta(identifier: string | null | undefined): TeamMeta {
  if (!identifier) return TEAM_DATA[DEFAULT_TEAM_ID];

  const id = identifier.toUpperCase();
  
  // 1. TeamCode ID 직접 매칭 (KIA, LG, SSG 등)
  if (id in TEAM_DATA) return TEAM_DATA[id as TeamCode];

  // 2. 백엔드 코드 매칭 (HT, SK, WO 등)
  if (BACKEND_CODE_MAP[id]) return BACKEND_CODE_MAP[id];

  // 3. 이름/약칭 매칭 (기아, KIA 등) - 대소문자 무관
  if (NAME_MAP[id]) return NAME_MAP[id];

  // 4. 모두 실패 시 DEFAULT
  return TEAM_DATA[DEFAULT_TEAM_ID];
}

/**
 * 🎨 TEAM_STYLES: 전 구단 공통 스타일 맵 (StyleSheet 사전 정의)
 */
export const TEAM_STYLES = StyleSheet.create(
  Object.entries(TEAM_DATA).reduce((acc, [code, meta]) => {
    const teamCode = code as TeamCode;
    acc[teamCode] = {
      backgroundColor: meta.color,
    };
    acc[`${teamCode}_TEXT`] = {
      color: meta.color,
    };
    return acc;
  }, {} as any) // StyleSheet.create가 최종 타입을 결정함
);

/**
 * 💅 getTeamBgStyle: 구단 배경색 스타일 반환 (하위 호환성용)
 */
export function getTeamBgStyle(identifier: string | null | undefined) {
  const meta = findTeamMeta(identifier);
  return TEAM_STYLES[meta.id] || TEAM_STYLES.DEFAULT;
}

/**
 * 📦 TEAM_LIST: 전체 구단 목록 (마스코트 포함)
 */
export const TEAM_LIST = Object.values(TEAM_DATA).filter(t => t.id !== DEFAULT_TEAM_ID);

/**
 * ✅ isValidTeamCode: 유효한 팀 코드인지 확인 (Type Guard)
 * Why: 런타임 입력을 unknown으로 받아 타입 안정성을 검증함.
 */
export function isValidTeamCode(code: unknown): code is TeamCode {
  if (typeof code !== "string") return false;
  return code in TEAM_DATA && code !== DEFAULT_TEAM_ID;
}
