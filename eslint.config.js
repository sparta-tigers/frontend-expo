// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const reactNative = require("eslint-plugin-react-native");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/**"],
  },
  {
    plugins: {
      "react-native": reactNative,
    },
    rules: {
      // 1. 인라인 스타일 작성 시 즉각적인 에러 (가장 중요)
      "react-native/no-inline-styles": "error",

      // 2. StyleSheet 내부에 #FFFFFF, 'red' 등 원시 색상 값 하드코딩 차단 (Theme 사용 강제)
      "react-native/no-color-literals": "error",

      // 3. 선언해두고 사용하지 않는 스타일 객체 청소
      "react-native/no-unused-styles": "error",
    },
  },
]);
