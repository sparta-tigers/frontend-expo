import { SafeLayout } from "@/components/ui/safe-layout";
import { useAuth } from "@/src/hooks/useAuth";
import { theme } from "@/src/styles/theme";
import { Logger } from "@/src/utils/logger";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { type Href, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Box, Typography } from "@/components/ui";

const loginLogo = require("@/assets/images/auth/yaguniv-logo.png");
const kakaoIcon = require("@/assets/images/auth/kakao.png");
const appleIcon = require("@/assets/images/auth/apple.png");

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
  tabBarHeight: theme.layout.auth.tabBarHeight,
  tabBarPaddingVertical: theme.layout.auth.tabBarPaddingVertical,
  tabLabelWidth: theme.layout.auth.tabLabelWidth,
  dividerLineHeight: StyleSheet.hairlineWidth,
} as const;

/**
 * 로그인 페이지 (`main_00`)
 *
 * Why: Figma 스펙(로고/그라데이션/필 입력/소셜 로그인/하단 네비 모형)을 기준으로
 * "로그인 경험"을 시각적으로 안정적으로 제공한다.
 */
export default function SigninScreen() {
  const { signin, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 추적
  const navigationReady = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      navigationReady.current = true;
      Logger.debug("[Signin] 네비게이터 준비 완료");
    }, 100);

    return () => {
      clearTimeout(timer);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // 🚨 앙드레 카파시: 안전한 리디렉션 로직
  const safeRedirect = (href: Href) => {
    if (!navigationReady.current) {
      redirectTimeoutRef.current = setTimeout(() => {
        Logger.debug("[Signin] 지연된 리디렉션 실행:", href);
        router.replace(href);
      }, 200);
      return;
    }

    Logger.debug("[Signin] 즉시 리디렉션 실행:", href);
    router.replace(href);
  };

  const handleSignin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요");
      return;
    }

    try {
      const success = await signin({ email, password });
      if (success) {
        Alert.alert("성공", "로그인되었습니다");
        // 🚨 앙드레 카파시: 안전한 리디렉션 사용
        safeRedirect("/(tabs)");
      } else {
        Alert.alert("실패", "로그인에 실패했습니다");
      }
    } catch (error) {
      Logger.error(
        "로그인 에러:",
        error instanceof Error ? error.message : String(error),
      );
      Alert.alert("오류", "로그인 중 오류가 발생했습니다");
    }
  };

  return (
    <SafeLayout style={styles.safeLayout} edges={["top", "left", "right"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={theme.spacing.xl}
      >
        <Pressable style={styles.pressableArea} onPress={Keyboard.dismiss}>
          {/* Header */}
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

          <LinearGradient
            colors={theme.colors.brand.loginGradientStops}
            locations={[0, 0.55, 1]}
            style={styles.gradientBody}
          >
            <Box width="100%" align="center" justify="center" mb="xxl">
              <Image
                source={loginLogo}
                style={styles.logo}
                contentFit="contain"
              />
            </Box>

            <Box width="100%" align="center" gap="md">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter usermail"
                placeholderTextColor={theme.colors.brand.subtitle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                editable={!isLoading}
                returnKeyType="next"
              />

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
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSignin}
                disabled={isLoading}
                style={styles.loginButton}
              >
                <Typography variant="body2" weight="regular" color="background" center>
                  LOGIN
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(auth)/signup")}
                disabled={isLoading}
                style={styles.registerButton}
              >
                <Typography variant="body2" weight="medium" color="brand.subtitle" center>
                  Register Now
                </Typography>
              </TouchableOpacity>

              <Box width="100%" height={LOCAL_LAYOUT.socialDividerHeight} align="center" justify="center">
                <Box 
                  width="100%" 
                  height={LOCAL_LAYOUT.dividerLineHeight} 
                  bg="background" 
                  style={styles.dividerLine}
                />
              </Box>

              <Box flexDir="row" align="center" justify="center" gap="xl" mt={-theme.spacing.xxl}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.socialButton}
                  disabled={isLoading}
                  onPress={() => Alert.alert("준비중", "카카오 로그인은 준비중입니다")}
                >
                  <Image
                    source={kakaoIcon}
                    style={styles.socialIcon}
                    contentFit="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.socialButton}
                  disabled={isLoading}
                  onPress={() => Alert.alert("준비중", "Apple 로그인은 준비중입니다")}
                >
                  <Image
                    source={appleIcon}
                    style={styles.socialIcon}
                    contentFit="contain"
                  />
                </TouchableOpacity>
              </Box>
            </Box>
          </LinearGradient>

          {/* Fake Tab Bar (Figma Design Reproduction) */}
          <Box 
            height={LOCAL_LAYOUT.tabBarHeight} 
            bg="card" 
            roundedTop="tabBar" 
            style={theme.shadow.card}
          >
            <Box flex={1} py={LOCAL_LAYOUT.tabBarPaddingVertical}>
              <Box flex={1} flexDir="row" px="xl" justify="space-between" align="center">
                {[
                  { name: "house.fill", label: "홈" },
                  { name: "chart.bar.fill", label: "라이브보드" },
                  { name: "arrow.left.arrow.right", label: "교환" },
                  { name: "bell.fill", label: "예매알림" },
                  { name: "list.bullet", label: "직관기록" },
                ].map((tab, idx) => (
                  <Box key={idx} width={LOCAL_LAYOUT.tabLabelWidth} align="center" justify="center" gap="xs">
                    <IconSymbol
                      size={theme.typography.size.xl}
                      name={tab.name as any}
                      color={theme.colors.brand.inactive}
                    />
                    <Typography variant="caption" color="brand.inactive" center>
                      {tab.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
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
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logo: {
    width: LOCAL_LAYOUT.logoWidth,
    height: LOCAL_LAYOUT.logoHeight,
  },
  input: {
    width: "100%",
    height: LOCAL_LAYOUT.inputHeight,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.primary,
  },
  loginButton: {
    width: "100%",
    height: LOCAL_LAYOUT.inputHeight,
    backgroundColor: theme.colors.brand.mint,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButton: {
    height: LOCAL_LAYOUT.inputHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  socialButton: {
    width: LOCAL_LAYOUT.socialButtonSize,
    height: LOCAL_LAYOUT.socialButtonSize,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  socialIcon: {
    width: LOCAL_LAYOUT.socialIconSize,
    height: LOCAL_LAYOUT.socialIconSize,
  },
  dividerLine: {
    opacity: 0.8,
  },
});
