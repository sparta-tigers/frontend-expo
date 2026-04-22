import { axiosInstance } from "../core/client";

/**
 * 서버에서 반환된 상대 경로 이미지 UR 을 절대 경로로 변환합니다.
 * @param path - 이미지 상대 경로 (예: /api/images/uuid_name.jpg)
 * @returns 절대 경로 URL (예: http://192.168.0.10:8080/api/images/uuid_name.jpg)
 */
export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return "";
  
  // 이미 절대 경로인 경우 (http로 시작) 그대로 반환
  if (path.startsWith("http")) return path;
  
  // BaseURL 가져오기
  const baseURL = axiosInstance.defaults.baseURL || "http://localhost:8080";
  
  // 경로 정규화 (중복 슬래시 제거)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${baseURL}${normalizedPath}`;
};
