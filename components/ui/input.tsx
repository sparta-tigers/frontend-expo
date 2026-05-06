import { theme } from "@/src/styles/theme";
import React from "react";
import { TextInput } from "react-native-paper";

/**
 * Input 컴포넌트 속성
 */
interface InputProps {
  /** 입력 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChangeText: (text: string) => void;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 보안 입력 여부 (비밀번호) */
  secureTextEntry?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 에러 상태 */
  error?: boolean;
  /** 키보드 타입 */
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  /** 전체 너비 차지 */
  fullWidth?: boolean;
  /** 커스텀 스타일 */
  style?: any;
  /** 라벨 텍스트 */
  label?: string;
  /** 여러 줄 입력 */
  multiline?: boolean;
  /** 줄 수 */
  numberOfLines?: number;
}

/**
 * Input 컴포넌트
 *
 * React Native Paper의 TextInput을 래핑
 * - Material Design 스타일 적용
 * - 플로팅 라벨 지원
 * - 에러 상태 표시
 * - Zero-Magic UI: 테마 토큰 연동
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  disabled = false,
  error = false,
  keyboardType = "default",
  fullWidth = false,
  style,
  label,
  multiline = false,
  numberOfLines,
}) => {
  const inputProps: any = {
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    disabled,
    error,
    mode: "outlined" as const,
    keyboardType,
    multiline,
    numberOfLines,
    outlineColor: theme.colors.border.medium,
    activeOutlineColor: theme.colors.brand.mint,
    placeholderTextColor: theme.colors.text.tertiary,
    textColor: theme.colors.text.primary,
    style: [
      {
        backgroundColor: theme.colors.surface,
        fontSize: theme.typography.size.md,
      },
      fullWidth && { width: "100%" },
      style,
    ],
    theme: {
      colors: {
        primary: theme.colors.brand.mint,
        error: theme.colors.error,
      },
    },
  };

  if (label) {
    inputProps.label = label;
  }

  return <TextInput {...inputProps} />;
};
