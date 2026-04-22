import { Logger } from "@/src/utils/logger";
import { useColorScheme as useReactNativeColorScheme } from "react-native";

/**
 * 시스템 컬러 스킴을 가져오는 훅
 *
 * @returns 현재 컬러 스킴 ('light' | 'dark' | null)
 *          - 'light': 라이트 모드
 *          - 'dark': 다크 모드
 *          - null: 시스템 설정을 따름 (iOS/Android 설정)
 */
export const useColorScheme = () => {
  const colorScheme = useReactNativeColorScheme();

  // 안전장치: colorScheme이 undefined일 경우 기본값 'light' 반환
  if (!colorScheme) {
    Logger.debug(
      "useColorScheme: colorScheme is undefined, defaulting to light",
    );
    return "light";
  }

  return colorScheme;
};
