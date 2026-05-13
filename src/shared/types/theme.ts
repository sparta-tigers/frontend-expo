import { theme } from "@/src/styles/theme";
import { TeamColorToken } from "@/src/utils/team";

/**
 * 객체의 중첩된 키 경로를 문자열 리터럴로 추출하는 유틸리티 타입
 * 
 * 예: { a: { b: string } } -> "a.b"
 */
type Leaves<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? "" : `.${Leaves<T[K]>}`}`;
    }[keyof T]
  : never;

/**
 * 테마 객체의 모든 컬러 경로 (e.g., "brand.mint", "team.kia", "success")
 * 
 * Why: 컴포넌트 Props에서 "any"를 제거하고, 오타를 컴파일 타임에 잡아내기 위함.
 */
export type ThemeColorPath = Leaves<typeof theme.colors>;

/**
 * 주어진 경로를 사용하여 테마 객체에서 색상 값을 안전하게 추출하는 함수
 * 
 * @param path - "brand.mint" 와 같은 형식의 문자열 경로
 * @returns 해당 경로의 색상 값 (string) 또는 undefined
 */
export const getThemeColorByPath = (path: string): string | undefined => {
  const keys = path.split(".");
  let current: unknown = theme.colors;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
};

/**
 * 테마 컬러 경로인지 확인하는 타입 가드
 */
export function isThemeColorPath(path: string): path is ThemeColorPath {
  return getThemeColorByPath(path) !== undefined;
}

/**
 * 구단 컬러 토큰을 테마 경로로 변환 (Deterministic)
 * 
 * Why: 컴포넌트 레벨에서 `as ThemeColorPath` 단언을 제거하고, 
 * 테마 시스템과 구단 시스템 간의 정합성을 보장하기 위함.
 */
export function getTeamColorPath(token?: TeamColorToken): ThemeColorPath {
  const path = `team.${token || "fallback"}`;
  // 🚨 앙드레 카파시: 이미 TeamColorToken이 theme.colors.team의 키임이 보장되므로 
  // 내부적으로는 단언하되 외부 인터페이스는 깨끗하게 유지함.
  return path as ThemeColorPath;
}
