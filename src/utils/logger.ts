/**
 * 중앙 통제형 로거 유틸리티 (Zero-Magic Architecture)
 * 
 * Why: 
 * 1. 무분별한 로그 노이즈 제거 (도메인 기반 필터링)
 * 2. 에러 추적성 강화 (Stack Trace 명시적 포맷팅)
 * 3. 런타임 성능 및 프로덕션 안정성 확보
 */

export type LogDomain = 'AUTH' | 'API' | 'CHAT' | 'MAP' | 'PUSH' | 'SYSTEM' | 'APP';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogOptions {
  domain?: LogDomain | undefined;
  error?: unknown | undefined;
  context?: Record<string, any> | undefined;
}

// 🚨 시니어 아키텍트 지침: 환경 변수는 초기 로드 시 한 번만 파싱하여 캐싱
const LOG_CONFIG = {
  // EXPO_PUBLIC_LOG_LEVEL: debug | info | warn | error
  minLevel: (process.env.EXPO_PUBLIC_LOG_LEVEL as LogLevel) || 'debug',
  // EXPO_PUBLIC_LOG_DOMAINS: AUTH,API,CHAT... (쉼표 구분)
  enabledDomains: process.env.EXPO_PUBLIC_LOG_DOMAINS 
    ? new Set(process.env.EXPO_PUBLIC_LOG_DOMAINS.split(',')) 
    : null, // null이면 모든 도메인 허용 (기본값)
};

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 로그 출력 가능 여부 판단
 */
const shouldLog = (level: LogLevel, domain: LogDomain = 'APP'): boolean => {
  if (!__DEV__ && level !== 'error') return false;
  
  // 레벨 필터링
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[LOG_CONFIG.minLevel]) return false;
  
  // 도메인 필터링 (빌드 타임 주입된 설정 기준)
  if (LOG_CONFIG.enabledDomains && !LOG_CONFIG.enabledDomains.has(domain)) return false;
  
  return true;
};

/**
 * 에러 스택 트레이스 및 컨텍스트 포맷팅
 */
const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return `\n[Stack Trace]\n${error.stack}\n`;
  }
  return typeof error === 'string' ? `\n[Error Message] ${error}` : `\n[Error Object] ${JSON.stringify(error)}`;
};

/**
 * 민감 정보 마스킹 유틸리티
 */
export const maskSensitive = (sensitive?: string | null): string => {
  if (!sensitive) return "null/undefined";
  if (sensitive.length < 10) return "***";
  return `${sensitive.substring(0, 6)}...${sensitive.substring(sensitive.length - 4)}`;
};

export const Logger = {
  debug: (message: string, optionsOrArg?: LogOptions | any, ...args: any[]) => {
    let domain: LogDomain = 'APP';
    let extraArgs = [];

    if (optionsOrArg && typeof optionsOrArg === 'object' && 'domain' in optionsOrArg) {
      domain = (optionsOrArg as LogOptions).domain || 'APP';
      extraArgs = args;
    } else {
      extraArgs = optionsOrArg !== undefined ? [optionsOrArg, ...args] : args;
    }

    if (!shouldLog('debug', domain)) return;
    console.debug(`🐛 [${domain}] ${message}`, ...extraArgs);
  },

  info: (message: string, optionsOrArg?: LogOptions | any, ...args: any[]) => {
    let domain: LogDomain = 'APP';
    let extraArgs = [];

    if (optionsOrArg && typeof optionsOrArg === 'object' && 'domain' in optionsOrArg) {
      domain = (optionsOrArg as LogOptions).domain || 'APP';
      extraArgs = args;
    } else {
      extraArgs = optionsOrArg !== undefined ? [optionsOrArg, ...args] : args;
    }

    if (!shouldLog('info', domain)) return;
    console.info(`💡 [${domain}] ${message}`, ...extraArgs);
  },

  warn: (message: string, optionsOrArg?: LogOptions | any, ...args: any[]) => {
    let domain: LogDomain = 'APP';
    let extraArgs = [];

    if (optionsOrArg && typeof optionsOrArg === 'object' && 'domain' in optionsOrArg) {
      domain = (optionsOrArg as LogOptions).domain || 'APP';
      extraArgs = args;
    } else {
      extraArgs = optionsOrArg !== undefined ? [optionsOrArg, ...args] : args;
    }

    if (!shouldLog('warn', domain)) return;
    console.warn(`⚠️ [${domain}] ${message}`, ...extraArgs);
  },

  error: (message: string, error?: unknown, options: LogOptions = { domain: 'APP' }) => {
    if (!shouldLog('error', options.domain)) return;
    
    const errorDetail = error ? formatError(error) : '';
    const contextDetail = options.context ? `\n[Context] ${JSON.stringify(options.context)}` : '';
    
    console.error(`🚨 [${options.domain || 'APP'}] ${message}${errorDetail}${contextDetail}`);
  },

  /**
   * 네트워크 에러 특화 출력 (하위 호환성 유지)
   */
  networkError: (message: string, error?: any) => {
    if (!shouldLog('error', 'API')) return;
    
    const context: Record<string, any> = {};
    if (error && typeof error === 'object') {
      if (error.code) context.code = error.code;
      if (error.response?.status) context.status = error.response.status;
      if (error.config?.url) context.url = error.config.url;
    }

    Logger.error(`🌐 [NETWORK] ${message}`, error, { domain: 'API', context });
  },

  /**
   * 도메인 전용 로거 생성 (팩토리 패턴)
   * Why: 매번 { domain: 'AUTH' }를 넘기는 번거로움을 제거하고 가독성 확보
   */
  category: (domain: LogDomain) => ({
    debug: (msg: string, ...args: any[]) => Logger.debug(msg, { domain }, ...args),
    info: (msg: string, ...args: any[]) => Logger.info(msg, { domain }, ...args),
    warn: (msg: string, ...args: any[]) => Logger.warn(msg, { domain }, ...args),
    error: (msg: string, err?: unknown, ctx?: Record<string, any>) => 
      Logger.error(msg, err, { domain, context: ctx }),
  }),
};

// 하위 호환성을 위한 개별 export
export const networkError = Logger.networkError;
