/**
 * 중앙 통제형 로거 유틸리티
 *
 * 모든 로그의 단일 진입점(SSOT)으로,
 * 개발 환경에서만 로그가 출력되도록 제어합니다.
 * 프로덕션 환경에서는 error 레벨만 출력됩니다.
 */

/**
 * 민감 정보(토큰, 비밀번호 등)를 안전하게 마스킹하는 유틸리티 함수
 * @param sensitive 민감 정보 문자열
 * @returns 마스킹된 문자열
 */
export const maskSensitive = (sensitive?: string | null): string => {
  if (!sensitive) return "null/undefined";
  if (sensitive.length < 10) return "***";
  return `${sensitive.substring(0, 6)}...${sensitive.substring(sensitive.length - 4)}`;
};

export const Logger = {
  /**
   * 디버그 레벨 로그
   * 개발 환경에서만 출력되는 상세 정보
   */
  debug: (message: string, ...args: any[]) => {
    if (__DEV__) console.debug(`🐛 [DEBUG] ${message}`, ...args);
  },

  /**
   * 정보 레벨 로그
   * 개발 환경에서만 출력되는 일반 정보
   */
  info: (message: string, ...args: any[]) => {
    if (__DEV__) console.info(`💡 [INFO] ${message}`, ...args);
  },

  /**
   * 경고 레벨 로그
   * 개발 환경에서만 출력되는 경고 정보
   */
  warn: (message: string, ...args: any[]) => {
    if (__DEV__) console.warn(`⚠️ [WARN] ${message}`, ...args);
  },

  /**
   * 에러 레벨 로그
   * 프로덕션 환경에서도 출력되는 에러 정보
   * 향후 Sentry/Crashlytics 연동을 고려한 설계
   */
  error: (message: string, error?: any) => {
    // Error는 프로덕션에서도 트래킹 툴 연동을 위해 남기거나 포맷팅
    console.error(`🚨 [ERROR] ${message}`, error || "");
  },
};
