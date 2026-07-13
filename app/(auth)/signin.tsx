import { Box, SafeLayout, Typography } from '@/components/ui';
import { useAuth } from '@/src/hooks/useAuth';
import { theme } from '@/src/styles/theme';
import { Logger } from '@/src/utils/logger';
import { getUserMessage } from '@/src/core/errors';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useToastStore } from '@/src/store/useToastStore';
import * as Haptics from 'expo-haptics';

const loginLogo = require('@/assets/images/auth/yaguniv-logo.png');
const kakaoIcon = require('@/assets/images/auth/kakao.png');
const appleIcon = require('@/assets/images/auth/apple.png');

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  bodyPaddingHorizontal: theme.layout.auth.bodyPaddingHorizontal,
  // bodyPaddingVertical은 사용 기기에 맞게 자동 정렬되도록 제거하거나 줄임
  logoWidth: theme.layout.auth.logoWidth * 0.8, // 로고 크기를 살짝 줄여 공간 확보
  logoHeight: theme.layout.auth.logoHeight * 0.8,
  inputHeight: 48, // 텍스트 잘림 방지 및 터치 타겟 44px 이상 확보 (기존 36)
  socialDividerHeight: 40, // 공간 확보를 위해 구분선 여백 축소
  dividerLineHeight: StyleSheet.hairlineWidth,
} as const;

/**
 * 로그인 페이지 (`main_00`)
 *
 * "Refined Stadium Night" - 깊이감 있는 인터랙션과 세련된 애니메이션.
 */
export default function SigninScreen() {
  const { signin, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const showToast = useToastStore((state) => state.showToast);

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 추적
  const navigationReady = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 포커스 상태 관리를 위한 state
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      navigationReady.current = true;
      Logger.debug('[Signin] 네비게이터 준비 완료');
    }, 100);

    return () => {
      clearTimeout(timer);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const safeRedirect = (href: Href) => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    if (!navigationReady.current) {
      redirectTimeoutRef.current = setTimeout(() => {
        Logger.debug('[Signin] 지연된 리디렉션 실행:', href);
        router.replace(href);
        redirectTimeoutRef.current = null;
      }, 200);
      return;
    }

    Logger.debug('[Signin] 즉시 리디렉션 실행:', href);
    router.replace(href);
  };

  const handleSignin = async () => {
    if (!email.trim() || !password.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('이메일과 비밀번호를 모두 입력해주세요', undefined, 'error');
      return;
    }

    try {
      const success = await signin({ email, password });
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('로그인 성공', undefined, 'success');
        safeRedirect('/(tabs)');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.', 'error');
      }
    } catch (error) {
      Logger.error('로그인 에러:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('로그인 실패', getUserMessage(error), 'error');
    }
  };

  const emailBorderStyle = {
    borderColor: emailFocus ? theme.colors.brand.mint : 'transparent',
    borderWidth: 1.5,
  };

  const passwordBorderStyle = {
    borderColor: passwordFocus ? theme.colors.brand.mint : 'transparent',
    borderWidth: 1.5,
  };

  return (
    <LinearGradient
      colors={theme.colors.brand.loginGradientStops}
      locations={[0, 0.55, 1]}
      style={styles.gradientRoot}
    >
      <SafeLayout style={styles.safeLayout} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={theme.spacing.xl}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.pressableArea} onPress={Keyboard.dismiss}>
            <Box style={styles.gradientBody}>
              <View>
                <Box width="100%" align="center" justify="center" mb="xl">
                  <Image source={loginLogo} style={styles.logo} contentFit="contain" />
                </Box>
              </View>

              <Box width="100%" align="center" gap="md" style={styles.formContainer}>
                {/* 소셜 로그인 (Primary Action) */}
                <View style={styles.fullWidth}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.socialButtonFull, styles.kakaoButton]}
                    disabled={isLoading}
                    onPress={() =>
                      showToast('준비 중', '카카오 로그인은 아직 준비하고 있어요.', 'info')
                    }
                    accessibilityRole="button"
                    accessibilityLabel="카카오 로그인"
                  >
                    <Box flexDir="row" align="center" justify="center" gap="sm">
                      <Image
                        source={kakaoIcon}
                        style={styles.socialIconSmall}
                        contentFit="contain"
                      />
                      <Typography variant="body1" weight="bold" style={styles.kakaoText}>
                        카카오로 시작하기
                      </Typography>
                    </Box>
                  </TouchableOpacity>
                </View>

                <View style={styles.fullWidth}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.socialButtonFull, styles.appleButton]}
                    disabled={isLoading}
                    onPress={() =>
                      showToast('준비 중', 'Apple 로그인은 아직 준비하고 있어요.', 'info')
                    }
                    accessibilityRole="button"
                    accessibilityLabel="애플 로그인"
                  >
                    <Box flexDir="row" align="center" justify="center" gap="sm">
                      <Image
                        source={appleIcon}
                        style={styles.socialIconSmall}
                        contentFit="contain"
                      />
                      <Typography variant="body1" weight="bold" style={styles.appleText}>
                        Apple로 시작하기
                      </Typography>
                    </Box>
                  </TouchableOpacity>
                </View>

                {/* 구분선 */}
                <View style={styles.fullWidth}>
                  <Box
                    width="100%"
                    height={LOCAL_LAYOUT.socialDividerHeight}
                    align="center"
                    justify="center"
                    mt="sm"
                    mb="sm"
                    flexDir="row"
                    gap="md"
                  >
                    <Box
                      flex={1}
                      height={LOCAL_LAYOUT.dividerLineHeight}
                      bg="background"
                      style={styles.dividerLine}
                    />
                    <Typography variant="body2" color="brand.subtitle">
                      또는 이메일로 로그인
                    </Typography>
                    <Box
                      flex={1}
                      height={LOCAL_LAYOUT.dividerLineHeight}
                      bg="background"
                      style={styles.dividerLine}
                    />
                  </Box>
                </View>

                {/* 이메일/비밀번호 입력 폼 */}
                <View style={styles.inputWrapper}>
                  <View style={[styles.inputBorder, emailBorderStyle]}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="이메일"
                      placeholderTextColor={theme.colors.brand.subtitle}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                      editable={!isLoading}
                      returnKeyType="next"
                      onFocus={() => {
                        setEmailFocus(true);
                      }}
                      onBlur={() => {
                        setEmailFocus(false);
                      }}
                      accessibilityLabel="이메일 입력"
                      accessibilityHint="로그인에 사용할 이메일을 입력하세요"
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <View style={[styles.inputBorder, passwordBorderStyle]}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="비밀번호"
                      placeholderTextColor={theme.colors.brand.subtitle}
                      secureTextEntry
                      style={styles.input}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleSignin}
                      onFocus={() => {
                        setPasswordFocus(true);
                      }}
                      onBlur={() => {
                        setPasswordFocus(false);
                      }}
                      accessibilityLabel="비밀번호 입력"
                      accessibilityHint="계정의 비밀번호를 입력하세요"
                    />
                  </View>
                </View>

                {/* 이메일 로그인 버튼 */}
                <View style={styles.buttonWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSignin}
                    disabled={isLoading}
                    style={styles.loginButton}
                    accessibilityRole="button"
                    accessibilityLabel="이메일로 로그인"
                    accessibilityState={{ disabled: isLoading }}
                  >
                    <Typography variant="body1" weight="bold" color="background" center>
                      로그인
                    </Typography>
                  </TouchableOpacity>
                </View>

                {/* 회원가입 버튼 */}
                <View style={styles.buttonWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push('/(auth)/signup')}
                    disabled={isLoading}
                    style={styles.registerButton}
                    accessibilityRole="button"
                    accessibilityLabel="회원가입 페이지로 이동"
                    accessibilityState={{ disabled: isLoading }}
                  >
                    <Typography variant="body2" weight="medium" color="brand.subtitle" center>
                      회원가입
                    </Typography>
                  </TouchableOpacity>
                </View>
              </Box>
            </Box>
          </Pressable>
        </KeyboardAwareScrollView>
      </SafeLayout>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.transparent,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.transparent,
  },
  pressableArea: {
    flex: 1,
  },
  gradientBody: {
    flex: 1,
    paddingHorizontal: LOCAL_LAYOUT.bodyPaddingHorizontal,
    paddingVertical: theme.spacing.xl, // 과도한 86px 패딩을 줄이고 중앙 정렬에 의존
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  logo: {
    width: LOCAL_LAYOUT.logoWidth,
    height: LOCAL_LAYOUT.logoHeight,
  },
  inputWrapper: {
    width: '100%',
  },
  inputBorder: {
    width: '100%',
    height: LOCAL_LAYOUT.inputHeight,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 0, // Android 텍스트 잘림 현상 방지
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.primary,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: theme.spacing.xs,
  },
  loginButton: {
    width: '100%',
    height: LOCAL_LAYOUT.inputHeight,
    backgroundColor: theme.colors.brand.mint,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.button,
  },
  registerButton: {
    height: LOCAL_LAYOUT.inputHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -theme.spacing.sm,
  },
  socialButtonFull: {
    width: '100%',
    height: LOCAL_LAYOUT.inputHeight,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.button,
  },
  kakaoButton: {
    backgroundColor: theme.colors.social.kakao.background,
  },
  kakaoText: {
    color: theme.colors.social.kakao.text,
    opacity: 0.85,
  },
  appleButton: {
    backgroundColor: theme.colors.social.apple.background,
  },
  appleText: {
    color: theme.colors.social.apple.text,
  },
  socialIconSmall: {
    width: 20,
    height: 20,
  },
  dividerLine: {
    opacity: 0.3,
  },
  fullWidth: {
    width: '100%',
  },
});
