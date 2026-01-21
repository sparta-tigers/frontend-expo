import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * 스토리지 유틸리티
 * 민감 데이터는 SecureStore, 일반 데이터는 AsyncStorage로 분리 저장
 */

/**
 * 민감한 데이터 저장 (JWT 토큰 등)
 * @param key - 저장 키
 * @param value - 저장 값
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`${key} 보안 저장 실패:`, error);
    throw new Error("보안 저장에 실패했습니다");
  }
}

/**
 * 민감한 데이터 조회 (JWT 토큰 등)
 * @param key - 조회 키
 * @returns 저장된 값 또는 null
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`${key} 보안 조회 실패:`, error);
    return null;
  }
}

/**
 * 민감한 데이터 삭제
 * @param key - 삭제 키
 */
export async function removeSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`${key} 보안 삭제 실패:`, error);
  }
}

/**
 * 일반 데이터 저장 (사용자 설정 등)
 * @param key - 저장 키
 * @param value - 저장 값
 */
export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`${key} 저장 실패:`, error);
    throw new Error("저장에 실패했습니다");
  }
}

/**
 * 일반 데이터 조회
 * @param key - 조회 키
 * @returns 저장된 값 또는 null
 */
export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`${key} 조회 실패:`, error);
    return null;
  }
}

/**
 * 일반 데이터 삭제
 * @param key - 삭제 키
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`${key} 삭제 실패:`, error);
  }
}

/**
 * 여러 데이터 한 번에 삭제
 * @param keys - 삭제할 키 목록
 */
export async function removeItems(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error("여러 데이터 삭제 실패:", error);
  }
}
