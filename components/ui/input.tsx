import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import {
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle
} from "react-native";

/**
 * Input 컴포넌트 속성
 */
interface InputProps {
  /** 입력값 */
  value?: string;
  /** 값 변경 핸들러 */
  onChangeText?: (text: string) => void;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 비밀번호 입력 여부 */
  secureTextEntry?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 입력 타입 */
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  /** 전체 너비 차지 */
  fullWidth?: boolean;
  /** 커스텀 스타일 */
  style?: TextStyle;
  /** 라벨 텍스트 */
  label?: string;
}

/**
 * 기본 Input 컴포넌트
 *
 * PWA의 Radix UI Input을 React Native로 대체
 * - 다양한 입력 타입 지원
 * - 에러 상태 표시
 * - 라벨 지원
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  disabled = false,
  error = false,
  errorMessage,
  keyboardType = "default",
  fullWidth = false,
  style,
  label,
}) => {
  const backgroundColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const borderColor = error
    ? useThemeColor({}, "destructive")
    : useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "muted");
  const errorColor = useThemeColor({}, "destructive");

  const getInputStyle = (): TextStyle => {
    return {
      borderWidth: 1,
      borderColor,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor,
      color: textColor,
      width: fullWidth ? "100%" : undefined,
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getContainerStyle = (): ViewStyle => {
    return {
      marginBottom: 16,
      width: fullWidth ? "100%" : undefined,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
      color: textColor,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: 12,
      color: errorColor,
      marginTop: 4,
    };
  };

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <TextInput
        style={[getInputStyle(), style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && errorMessage && (
        <Text style={getErrorStyle()}>{errorMessage}</Text>
      )}
    </View>
  );
};
