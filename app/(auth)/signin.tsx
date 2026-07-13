import { Box, SafeLayout, Typography } from '@/components/ui';
import { useAuth } from '@/src/hooks/useAuth';
import { theme } from '@/src/styles/theme';
import { Logger } from '@/src/utils/logger';
import { getUserMessage } from '@/src/core/errors';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useToastStore } from '@/src/store/useToastStore';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const loginLogo = require('@/assets/images/auth/yaguniv-logo.png');
const kakaoIcon = require('@/assets/images/auth/kakao.png');
const appleIcon = require('@/assets/images/auth/apple.png');

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerHeight: theme.layout.auth.headerHeight,
  headerIconBox: theme.layout.auth.headerIconBox,
  bodyPaddingHorizontal: theme.layout.auth.bodyPaddingHorizontal,
  bodyPaddingVertical: theme.layout.auth.bodyPaddingVertical,
  logoWidth: theme.layout.auth.logoWidth,
  logoHeight: theme.layout.auth.logoHeight,
  inputHeight: theme.layout.auth.inputHeight,
  socialButtonSize: theme.layout.auth.socialButtonSize,
  socialIconSize: theme.layout.auth.socialIconSize,
  socialDividerHeight: theme.layout.auth.socialDividerHeight,
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

  // 포커스 상태 관리를 위한 SharedValue
  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);

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
    if (!navigationReady.current) {
      redirectTimeoutRef.current = setTimeout(() => {
        Logger.debug('[Signin] 지연된 리디렉션 실행:', href);
        router.replace(href);
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

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(emailFocus.value ? theme.colors.brand.mint : 'transparent', {
      duration: 300,
    }),
    borderWidth: 1.5,
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(passwordFocus.value ? theme.colors.brand.mint : 'transparent', {
      duration: 300,
    }),
    borderWidth: 1.5,
  }));

  return (
    <SafeLayout style={styles.safeLayout} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={theme.spacing.xl}
      >
        <Pressable style={styles.pressableArea} onPress={Keyboard.dismiss}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)}>
            <Box
              height={LOCAL_LAYOUT.headerHeight}
              px="xl"
              pb="sm"
              flexDir="row"
              align="flex-end"
              justify="space-between"
              bg="background"
            >
              <Box width={LOCAL_LAYOUT.headerIconBox} height={LOCAL_LAYOUT.headerIconBox} />
              <Typography variant="h3" weight="regular" color="brand.mint" center>
                YAGUNIV
              </Typography>
              <Box width={LOCAL_LAYOUT.headerIconBox} height={LOCAL_LAYOUT.headerIconBox} />
            </Box>
          </Animated.View>

          <LinearGradient
            colors={theme.colors.brand.loginGradientStops}
            locations={[0, 0.55, 1]}
            style={styles.gradientBody}
          >
            <Animated.View entering={FadeInUp.delay(200).duration(800).springify()}>
              <Box width="100%" align="center" justify="center" mb="xxl">
                <Image source={loginLogo} style={styles.logo} contentFit="contain" />
              </Box>
            </Animated.View>

            <Box width="100%" align="center" gap="lg" style={styles.formContainer}>
              <Animated.View
                entering={FadeInUp.delay(300).duration(800).springify()}
                style={styles.inputWrapper}
              >
                <Animated.View style={[styles.inputBorder, emailAnimatedStyle]}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email Address"
                    placeholderTextColor={theme.colors.brand.subtitle}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    editable={!isLoading}
                    returnKeyType="next"
                    onFocus={() => {
                      emailFocus.value = 1;
                    }}
                    onBlur={() => {
                      emailFocus.value = 0;
                    }}
                    accessibilityLabel="이메일 입력"
                    accessibilityHint="로그인에 사용할 이메일을 입력하세요"
                  />
                </Animated.View>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(400).duration(800).springify()}
                style={styles.inputWrapper}
              >
                <Animated.View style={[styles.inputBorder, passwordAnimatedStyle]}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.brand.subtitle}
                    secureTextEntry
                    style={styles.input}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleSignin}
                    onFocus={() => {
                      passwordFocus.value = 1;
                    }}
                    onBlur={() => {
                      passwordFocus.value = 0;
                    }}
                    accessibilityLabel="비밀번호 입력"
                    accessibilityHint="계정의 비밀번호를 입력하세요"
                  />
                </Animated.View>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(500).duration(800).springify()}
                style={styles.buttonWrapper}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSignin}
                  disabled={isLoading}
                  style={styles.loginButton}
                  accessibilityRole="button"
                  accessibilityLabel="로그인"
                  accessibilityState={{ disabled: isLoading }}
                >
                  <Typography variant="body1" weight="bold" color="background" center>
                    LOGIN
                  </Typography>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(600).duration(800).springify()}
                style={styles.buttonWrapper}
              >
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
                    Register Now
                  </Typography>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(700).duration(800).springify()}
                style={styles.fullWidth}
              >
                <Box
                  width="100%"
                  height={LOCAL_LAYOUT.socialDividerHeight}
                  align="center"
                  justify="center"
                  mt="xl"
                  mb="md"
                >
                  <Box
                    width="100%"
                    height={LOCAL_LAYOUT.dividerLineHeight}
                    bg="background"
                    style={styles.dividerLine}
                  />
                </Box>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(800).duration(800).springify()}
                style={styles.fullWidth}
              >
                <Box
                  flexDir="row"
                  align="center"
                  justify="center"
                  gap="xl"
                  style={styles.socialButtonsContainer}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.socialButton}
                    disabled={isLoading}
                    onPress={() =>
                      showToast('준비 중', '카카오 로그인은 아직 준비하고 있어요.', 'info')
                    }
                    accessibilityRole="button"
                    accessibilityLabel="카카오 로그인"
                  >
                    <Image source={kakaoIcon} style={styles.socialIcon} contentFit="contain" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.socialButton}
                    disabled={isLoading}
                    onPress={() =>
                      showToast('준비 중', 'Apple 로그인은 아직 준비하고 있어요.', 'info')
                    }
                    accessibilityRole="button"
                    accessibilityLabel="애플 로그인"
                  >
                    <Image source={appleIcon} style={styles.socialIcon} contentFit="contain" />
                  </TouchableOpacity>
                </Box>
              </Animated.View>
            </Box>
          </LinearGradient>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  safeLayout: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.brand.background,
  },
  pressableArea: {
    flex: 1,
  },
  gradientBody: {
    flex: 1,
    paddingHorizontal: LOCAL_LAYOUT.bodyPaddingHorizontal,
    paddingTop: LOCAL_LAYOUT.bodyPaddingVertical,
    paddingBottom: LOCAL_LAYOUT.bodyPaddingVertical,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.primary,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: theme.spacing.md,
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
  socialButton: {
    width: LOCAL_LAYOUT.socialButtonSize,
    height: LOCAL_LAYOUT.socialButtonSize,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  socialIcon: {
    width: LOCAL_LAYOUT.socialIconSize,
    height: LOCAL_LAYOUT.socialIconSize,
  },
  dividerLine: {
    opacity: 0.3,
  },
  socialButtonsContainer: {
    width: '100%',
  },
  fullWidth: {
    width: '100%',
  },
});
