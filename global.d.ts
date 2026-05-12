/**
 * 🚨 Andrej Karpathy: Global TypeScript Type Definitions
 * 
 * Why: To prevent 'as any' casts and extend standard interfaces like FormData for React Native environment.
 */

interface FormDataValue {
  uri: string;
  name: string;
  type: string;
}

interface FormDataJson {
  string: string;
  type: string;
}

declare interface FormData {
  append(name: string, value: string | Blob): void;
  append(name: string, value: FormDataValue | FormDataJson): void;
  append(name: string, value: string | Blob | FormDataValue | FormDataJson, fileName?: string): void;
}
