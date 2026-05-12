/**
 * 🚨 Andrej Karpathy: Global TypeScript Type Definitions
 * 
 * Why: To prevent 'as any' casts and extend standard interfaces like FormData for React Native environment.
 */

/**
 * 직관 인증샷 이미지 정보 규약
 * Why: React Native의 FormData 전송 시 파일 객체를 표현하기 위한 네이티브 브릿지 규격임.
 */
interface FormDataValue {
  uri: string;
  name: string;
  type: string;
}

/**
 * JSON 데이터 전송 규약
 * Why: [Phase 33] 비표준 FormDataJson 방식을 폐기하고 표준 JSON.stringify 문자열 전송으로 대체함.
 */

/**
 * 표준 FormData 인터페이스 확장
 * Why: React Native 환경에서 Multipart/form-data 전송 시 문자열/파일 외에 
 * 네이티브 브릿지 규격(FormDataValue)을 append할 수 있도록 오버로딩함.
 */
declare interface FormData {
  append(name: string, value: string | Blob | FormDataValue): void;
}
