// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const reactNative = require("eslint-plugin-react-native");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/**"],
  },
  // 1. 전역(Global) 플러그인 및 룰 설정을 먼저 배치합니다.
  {
    plugins: {
      "react-native": reactNative,
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
    },
  },
  // 2. 특정 파일들에 대한 예외(Override) 설정을 그 아래에 배치하여 덮어씁니다.
  {
    files: ["src/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["scripts/*.js"],
    rules: {
      "no-console": "off",
    },
  },
]);
