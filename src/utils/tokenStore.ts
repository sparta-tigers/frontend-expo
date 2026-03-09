import * as SecureStore from "expo-secure-store";

/**
 * 중앙 토큰 저장소
 * SecureStore와 메모리 캐시를 통합한 토큰 관리
 *
 * Design Principles:
 * - Single Source of Truth: 토큰은 이 모듈을 통해서만 접근
 * - Memory-first: 메모리에 캐시하여 SecureStore I/O 최소화
 * - Type Safety: string | null 타입으로 null 가능성 명시
 */

// 모듈 스코프 private 변수 (외부 직접 접근 금지)
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

// SecureStore 키 상수
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * 액세스 토큰 반환
 * 메모리에 있으면 즉시 반환, 없으면 SecureStore에서 로드
 *
 * @returns Promise<string | null> 액세스 토큰 또는 null
 */
export async function getAccessToken(): Promise<string | null> {
  // 메모리 캐시 우선
  if (_accessToken !== null) {
    return _accessToken;
  }

  // SecureStore에서 로드
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    _accessToken = token; // 메모리 캐시 저장
    return token;
  } catch (error) {
    console.error("Failed to load access token from SecureStore:", error);
    return null;
  }
}

/**
 * 리프레시 토큰 반환
 * 메모리에 있으면 즉시 반환, 없으면 SecureStore에서 로드
 *
 * @returns Promise<string | null> 리프레시 토큰 또는 null
 */
export async function getRefreshToken(): Promise<string | null> {
  // 메모리 캐시 우선
  if (_refreshToken !== null) {
    return _refreshToken;
  }

  // SecureStore에서 로드
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    _refreshToken = token; // 메모리 캐시 저장
    return token;
  } catch (error) {
    console.error("Failed to load refresh token from SecureStore:", error);
    return null;
  }
}

/**
 * 토큰 저장
 * 메모리와 SecureStore에 동시에 저장
 *
 * @param accessToken - 액세스 토큰
 * @param refreshToken - 리프레시 토큰
 * @returns Promise<boolean> 저장 성공 여부
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<boolean> {
  try {
    // 메모리 업데이트
    _accessToken = accessToken;
    _refreshToken = refreshToken;

    // SecureStore에 저장
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

    return true;
  } catch (error) {
    console.error("Failed to save tokens to SecureStore:", error);

    // SecureStore 저장 실패 시 메모리도 롤백
    _accessToken = null;
    _refreshToken = null;

    return false;
  }
}

/**
 * 토큰 삭제
 * 메모리와 SecureStore에서 동시에 삭제
 *
 * @returns Promise<boolean> 삭제 성공 여부
 */
export async function clearTokens(): Promise<boolean> {
  try {
    // 메모리 초기화
    _accessToken = null;
    _refreshToken = null;

    // SecureStore에서 삭제
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

    return true;
  } catch (error) {
    console.error("Failed to clear tokens from SecureStore:", error);
    return false;
  }
}

/**
 * 메모리 캐시 초기화 (앱 시작 시 호출용)
 * SecureStore에 있는 토큰으로 메모리 캐시를 미리 로드
 *
 * @returns Promise<void>
 */
export async function initializeTokenCache(): Promise<void> {
  // 메모리 캐시 초기화
  _accessToken = null;
  _refreshToken = null;

  // 비동기로 미리 로드 (await 하지 않음)
  getAccessToken().catch(console.error);
  getRefreshToken().catch(console.error);
}

/**
 * 디버그용: 현재 메모리 상태 반환 (개발 환경에서만 사용)
 *
 * @returns 현재 메모리 캐시 상태
 */
export function getDebugTokenState(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (__DEV__) {
    console.log("🔍 [Token Cache State]");
    console.log(
      "- Access Token:",
      _accessToken ? `${_accessToken.substring(0, 20)}...` : "null",
    );
    console.log(
      "- Refresh Token:",
      _refreshToken ? `${_refreshToken.substring(0, 20)}...` : "null",
    );
    console.log(
      "- Access Token Format:",
      _accessToken?.startsWith("eyJ") ? "JWT" : "Invalid",
    );
    console.log(
      "- Refresh Token Format:",
      _refreshToken?.startsWith("eyJ") ? "JWT" : "Invalid",
    );
  }

  return {
    accessToken: _accessToken,
    refreshToken: _refreshToken,
  };
}

/**
 * 토큰 형식 검증 함수
 * @param token - 검증할 토큰
 * @returns 형식 유효성 여부
 */
export function validateTokenFormat(token: string | null): boolean {
  if (!token) return false;

  // JWT 토큰은 보통 3부분으로 구성 (header.payload.signature)
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  // 각 부분이 base64url 형식인지 기본 검증
  try {
    parts.forEach((part) => {
      // base64url 디코딩 시도 (실패하면 에러 발생)
      const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
      atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    });
    return true;
  } catch {
    return false;
  }
}
