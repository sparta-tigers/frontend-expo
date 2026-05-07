/**
 * KBO 팀 컬러 유틸리티
 *
 * Why: liveboard.tsx, schedule.tsx 등 다수 화면에서 팀명 → 컬러 매핑이 필요.
 * 각 파일에서 하드코딩하면 SSOT가 깨지므로, theme.colors.team 토큰을 기반으로
 * 순수 함수 + StyleSheet 사전 정의 맵을 제공한다.
 */
import { StyleSheet } from "react-native";
import { theme } from "@/src/styles/theme";
import { TeamDto } from "@/src/features/home/types";

/**
 * KBO 10개 구단 상세 데이터 맵
 * 
 * Why: 팀 ID(코드)만으로 마스코트, 약칭, 풀네임 등을 즉시 조회하기 위함.
 */
export const TEAM_DATA: Record<string, TeamDto> = {
  KIA: { name: "KIA 타이거즈", shortName: "KIA", subName: "타이거즈", mascotEmoji: "🐯", color: theme.colors.team.kia },
  LG: { name: "LG 트윈스", shortName: "LG", subName: "트윈스", mascotEmoji: "👯", color: theme.colors.team.lg },
  KT: { name: "KT 위즈", shortName: "KT", subName: "위즈", mascotEmoji: "🧙", color: theme.colors.team.kt },
  SSG: { name: "SSG 랜더스", shortName: "SSG", subName: "랜더스", mascotEmoji: "🛸", color: theme.colors.team.ssg },
  NC: { name: "NC 다이노스", shortName: "NC", subName: "다이노스", mascotEmoji: "🦖", color: theme.colors.team.nc },
  DOOSAN: { name: "두산 베어스", shortName: "두산", subName: "베어스", mascotEmoji: "🐻", color: theme.colors.team.doosan },
  LOTTE: { name: "롯데 자이언츠", shortName: "롯데", subName: "자이언츠", mascotEmoji: "⚓", color: theme.colors.team.lotte },
  SAMSUNG: { name: "삼성 라이온즈", shortName: "삼성", subName: "라이온즈", mascotEmoji: "🦁", color: theme.colors.team.samsung },
  HANWHA: { name: "한화 이글스", shortName: "한화", subName: "이글스", mascotEmoji: "🦅", color: theme.colors.team.hanwha },
  KIWOOM: { name: "키움 히어로즈", shortName: "키움", subName: "히어로즈", mascotEmoji: "🦸", color: theme.colors.team.kiwoom },
} as const;

/**
 * KBO 팀 약칭 → theme 컬러 매핑 테이블
 *
 * Java의 static Map<String, String>과 동일한 역할.
 * key: 화면에서 사용되는 팀 약칭(한글/영문)
 * value: theme.colors.team.* 컬러 값
 */
const TEAM_NAME_TO_COLOR: Record<string, string> = {
  // 한글 약칭
  "한화": theme.colors.team.hanwha,
  "LG": theme.colors.team.lg,
  "롯데": theme.colors.team.lotte,
  "삼성": theme.colors.team.samsung,
  "NC": theme.colors.team.nc,
  "SSG": theme.colors.team.ssg,
  "두산": theme.colors.team.doosan,
  "KT": theme.colors.team.kt,
  "키움": theme.colors.team.kiwoom,
  "KIA": theme.colors.team.kia,

  // 영문 ID 및 풀네임
  "KIA_TIGERS": theme.colors.team.kia,
  "LG_TWINS": theme.colors.team.lg,
  "HANWHA_EAGLES": theme.colors.team.hanwha,
  "LOTTE_GIANTS": theme.colors.team.lotte,
  "SAMSUNG_LIONS": theme.colors.team.samsung,
  "SSG_LANDERS": theme.colors.team.ssg,
  "NC_DINOS": theme.colors.team.nc,
  "KT_WIZ": theme.colors.team.kt,
  "DOOSAN_BEARS": theme.colors.team.doosan,
  "KIWOOM_HEROES": theme.colors.team.kiwoom,

  // 경기 일정 등에서 사용되는 풀네임
  "한화 이글스": theme.colors.team.hanwha,
  "LG 트윈스": theme.colors.team.lg,
  "롯데 자이언츠": theme.colors.team.lotte,
  "삼성 라이온즈": theme.colors.team.samsung,
  "NC 다이노스": theme.colors.team.nc,
  "SSG 랜더스": theme.colors.team.ssg,
  "두산 베어스": theme.colors.team.doosan,
  "KT 위즈": theme.colors.team.kt,
  "키움 히어로즈": theme.colors.team.kiwoom,
  "KIA 타이거즈": theme.colors.team.kia,
} as const;

/**
 * 팀명으로부터 테마 컬러 경로(dot notation)를 반환하는 유틸리티
 * 
 * Why: Typography의 color prop에 "team.kia"와 같은 토큰을 직접 전달하기 위함.
 */
export const getTeamColorPath = (teamName: string) => {
  const mapping: Record<string, string> = {
    "KIA": "team.kia", "KIA 타이거즈": "team.kia", "KIA_TIGERS": "team.kia",
    "LG": "team.lg", "LG 트윈스": "team.lg", "LG_TWINS": "team.lg",
    "한화": "team.hanwha", "한화 이글스": "team.hanwha", "HANWHA_EAGLES": "team.hanwha",
    "롯데": "team.lotte", "롯데 자이언츠": "team.lotte", "LOTTE_GIANTS": "team.lotte",
    "삼성": "team.samsung", "삼성 라이온즈": "team.samsung", "SAMSUNG_LIONS": "team.samsung",
    "SSG": "team.ssg", "SSG 랜더스": "team.ssg", "SSG_LANDERS": "team.ssg",
    "NC": "team.nc", "NC 다이노스": "team.nc", "NC_DINOS": "team.nc",
    "KT": "team.kt", "KT 위즈": "team.kt", "KT_WIZ": "team.kt",
    "두산": "team.doosan", "두산 베어스": "team.doosan", "DOOSAN_BEARS": "team.doosan",
    "키움": "team.kiwoom", "키움 히어로즈": "team.kiwoom", "KIWOOM_HEROES": "team.kiwoom",
  };
  return (mapping[teamName] ?? "text.primary") as any;
};

/**
 * 팀명으로부터 컬러 값을 반환하는 순수 함수
 *
 * @param teamName - KBO 팀 약칭 또는 풀네임
 * @returns hex 컬러 문자열
 */
export const getTeamColor = (teamName: string): string => {
  return TEAM_NAME_TO_COLOR[teamName] ?? theme.colors.team.fallback;
};

/**
 * 팀별 배경색 StyleSheet 사전 정의 맵
 *
 * Why: useMemo로 매 렌더마다 스타일 객체를 생성하는 대신,
 * 컴포넌트 밖에서 StyleSheet.create로 10개 구단 배경색을 미리 만들어 둔다.
 * 렌더링 시 TEAM_BG_STYLES[teamName]로 O(1) 접근.
 */
export const TEAM_BG_STYLES = StyleSheet.create(
  Object.fromEntries(
    Object.entries(TEAM_NAME_TO_COLOR).map(([name, color]) => [
      name,
      { backgroundColor: color },
    ]),
  ) as Record<string, { backgroundColor: string }>,
);

/**
 * 팀별 테두리색 StyleSheet 사전 정의 맵
 */
export const TEAM_BORDER_STYLES = StyleSheet.create(
  Object.fromEntries(
    Object.entries(TEAM_NAME_TO_COLOR).map(([name, color]) => [
      name,
      { borderColor: color },
    ]),
  ) as Record<string, { borderColor: string }>,
);

/**
 * 팀명에 대한 테두리색 스타일 반환
 */
export const getTeamBorderStyle = (teamName: string) => {
  return TEAM_BORDER_STYLES[teamName] ?? { borderColor: theme.colors.team.fallback };
};

/**
 * 팀명에 대한 배경색 스타일 반환
 */
export const getTeamBgStyle = (teamName: string) => {
  return TEAM_BG_STYLES[teamName] ?? { backgroundColor: theme.colors.team.fallback };
};
