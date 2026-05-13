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
 * ⚡ O(1) 조회를 위한 내부 매핑 맵 (Internal Lookup Maps)
 */
const BACKEND_CODE_MAP = Object.values(TEAM_DATA).reduce((acc, team) => {
  acc[team.backendCode] = team;
  return acc;
}, {} as Record<string, TeamMeta>);

const NAME_MAP = Object.values(TEAM_DATA).reduce((acc, team) => {
  acc[team.name] = team;
  acc[team.shortName] = team;
  return acc;
}, {} as Record<string, TeamMeta>);

/**
 * 🔍 findTeamMeta: 구단 식별자를 기반으로 결정론적 메타데이터 반환
 * 
 * Why: backendCode(HT), shortName(KIA), name(KIA 타이거즈) 등 
 *      어떤 입력값이 들어와도 동일한 TeamMeta 객체로 수렴하게 함.
 * @param identifier - 구단 코드, 이름 또는 백엔드 코드
 */
export function findTeamMeta(identifier: string | null | undefined): TeamMeta {
  if (!identifier) return TEAM_DATA.DEFAULT;

  const id = identifier.toUpperCase();
  
  // 1. TeamCode ID 직접 매칭
  if (id in TEAM_DATA) return TEAM_DATA[id as TeamCode];

  // 2. 백엔드 코드 매칭 (HT, SK, WO 등)
  if (BACKEND_CODE_MAP[id]) return BACKEND_CODE_MAP[id];

  // 3. 이름/약칭 매칭
  if (NAME_MAP[identifier]) return NAME_MAP[identifier];

  // 4. 모두 실패 시 DEFAULT
  return TEAM_DATA.DEFAULT;
}

/**
 * 🎨 TEAM_STYLES: 전 구단 공통 스타일 맵 (StyleSheet 사전 정의)
 * 
 * Why: 아키텍처 가이드에 따라 렌더링 시점의 스타일 계산 비용을 $O(1)$으로 최적화하고,
 *      인라인 스타일 사용을 방지함.
 */
export const TEAM_STYLES = StyleSheet.create(
  Object.entries(TEAM_DATA).reduce((acc, [code, meta]) => {
    acc[code] = {
      backgroundColor: meta.color,
    };
    acc[`${code}_TEXT`] = {
      color: meta.color,
    };
    return acc;
  }, {} as Record<string, { backgroundColor?: string; color?: string }>)
);

/**
 * 💅 getTeamBgStyle: 구단 배경색 스타일 반환 (하위 호환성용)
 * @param identifier - 구단 식별자
 */
export function getTeamBgStyle(identifier: string | null | undefined) {
  const meta = findTeamMeta(identifier);
  return TEAM_STYLES[meta.id] || { backgroundColor: theme.colors.team.fallback };
}

/**
 * 📦 TEAM_LIST: 전체 구단 목록 (마스코트 포함)
 */
export const TEAM_LIST = Object.values(TEAM_DATA).filter(t => t.id !== 'DEFAULT');
