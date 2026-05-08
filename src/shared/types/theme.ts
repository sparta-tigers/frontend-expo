import { theme } from "@/src/styles/theme";

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
export type ThemeColorPath = Leaves<typeof theme.colors> | keyof typeof theme.colors;

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
