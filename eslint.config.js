// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const reactNative = require("eslint-plugin-react-native");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      ".expo/**",
      "scripts/architecture-guard/**",
      "eslint.config.js",
    ],
  },
  // 1. 전역(Global) 플러그인 및 룰 설정을 먼저 배치합니다.
  {
    plugins: {
      "react-native": reactNative,
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // 인라인 스타일 작성 시 즉각적인 에러 (가장 중요)
      "react-native/no-inline-styles": "error",
      // StyleSheet 내부에 #FFFFFF, 'red' 등 원시 색상 값 하드코딩 차단 (Theme 사용 강제)
      "react-native/no-color-literals": "error",
      // 선언해두고 사용하지 않는 스타일 객체 청소
      "react-native/no-unused-styles": "error",
      // console 로직 직접 사용 금지 (Logger 사용 강제)
      "no-console": "error",

      // TypeScript "Zero Magic" (any 및 강제 캐스팅 절대 금지)
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never", // 객체 리터럴에서 'as T' 금지
        },
      ],
      // 2. 결정론적 상태 관리 (의존성 배열 누락은 범죄입니다)
      "react-hooks/exhaustive-deps": "error",

      // 3. 비동기 안전장치
      "@typescript-eslint/no-floating-promises": ["error", { ignoreVoid: false }], // 비동기 호출 시 await 명시 필수 (void 우회 차단)

      // 4. 아키텍처 경계 (절대 경로 사용 권장 및 상위 디렉토리 참조 제한)
      "no-restricted-imports": [
        "error",
        {
          patterns: ["../../*"], // 두 단계 위로 올라가는 상대 경로 참조 금지 (Module 상위 구조 침범 방지)
        },
      ],
    },
  },
  // 2. 특정 파일들에 대한 예외(Override) 설정을 그 아래에 배치하여 덮어씁니다.
  {
    files: ["src/utils/logger.ts", "scripts/*.js"],
    rules: {
      "no-console": "off",
    },
  },
]);
