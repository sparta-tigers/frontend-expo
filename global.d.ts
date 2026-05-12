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
 * Why: Multipart 요청 내에서 application/json 파트를 문자열화하여 전송하기 위한 래퍼 타입임.
 */
interface FormDataJson {
  string: string;
  type: string;
}

/**
 * 표준 FormData 인터페이스 확장
 * Why: React Native 환경에서 Multipart/form-data 전송 시 문자열/파일 외에 
 * 커스텀 객체(FormDataValue, FormDataJson)를 append할 수 있도록 오버로딩함.
 */
declare interface FormData {
  append(name: string, value: string | Blob): void;
  append(name: string, value: FormDataValue | FormDataJson): void;
  append(name: string, value: string | Blob | FormDataValue | FormDataJson, fileName?: string): void;
}
