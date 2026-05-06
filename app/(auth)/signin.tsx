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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

const loginLogo = require("@/assets/images/auth/yaguniv-logo.png");
const kakaoIcon = require("@/assets/images/auth/kakao.png");
const appleIcon = require("@/assets/images/auth/apple.png");

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
          <View style={styles.header}>
            <View style={styles.headerSide} />
            <Text style={styles.headerTitle}>YAGUNIV</Text>
            <View style={styles.headerSide} />
          </View>

          <LinearGradient
            colors={theme.colors.brand.loginGradientStops}
            locations={[0, 0.55, 1]}
            style={styles.body}
          >
            <View style={styles.logoWrap}>
              <Image
                source={loginLogo}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <View style={styles.form}>
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
                <Text style={styles.loginButtonText}>LOGIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(auth)/signup")}
                disabled={isLoading}
                style={styles.registerButton}
              >
                <Text style={styles.registerText}>Register Now</Text>
              </TouchableOpacity>

              <View style={styles.socialDivider}>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
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
              </View>
            </View>
          </LinearGradient>

          <View style={styles.fakeTabBar}>
            <View style={styles.fakeTabBarInner}>
              <View style={styles.fakeTabIconsRow}>
                <View style={styles.fakeTabItem}>
                  <IconSymbol
                    size={theme.typography.size.xl}
                    name="house.fill"
                    color={theme.colors.brand.inactive}
                  />
                  <Text style={styles.fakeTabLabel}>홈</Text>
                </View>
                <View style={styles.fakeTabItem}>
                  <IconSymbol
                    size={theme.typography.size.xl}
                    name="chart.bar.fill"
                    color={theme.colors.brand.inactive}
                  />
                  <Text style={styles.fakeTabLabel}>라이브보드</Text>
                </View>
                <View style={styles.fakeTabItem}>
                  <IconSymbol
                    size={theme.typography.size.xl}
                    name="arrow.left.arrow.right"
                    color={theme.colors.brand.inactive}
                  />
                  <Text style={styles.fakeTabLabel}>교환</Text>
                </View>
                <View style={styles.fakeTabItem}>
                  <IconSymbol
                    size={theme.typography.size.xl}
                    name="bell.fill"
                    color={theme.colors.brand.inactive}
                  />
                  <Text style={styles.fakeTabLabel}>예매알림</Text>
                </View>
                <View style={styles.fakeTabItem}>
                  <IconSymbol
                    size={theme.typography.size.xl}
                    name="list.bullet"
                    color={theme.colors.brand.inactive}
                  />
                  <Text style={styles.fakeTabLabel}>직관기록</Text>
                </View>
              </View>
            </View>
          </View>
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
  header: {
    height: theme.layout.auth.headerHeight,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: theme.colors.brand.background,
  },
  headerSide: {
    width: theme.layout.auth.headerIconBox,
    height: theme.layout.auth.headerIconBox,
  },
  headerTitle: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.brand.mint,
    textAlign: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.layout.auth.bodyPaddingHorizontal,
    paddingTop: theme.layout.auth.bodyPaddingVertical,
    paddingBottom: theme.layout.auth.bodyPaddingVertical,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logoWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    width: theme.layout.auth.logoWidth,
    height: theme.layout.auth.logoHeight,
  },
  form: {
    width: "100%",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  input: {
    width: "100%",
    height: theme.layout.auth.inputHeight,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.primary,
  },
  loginButton: {
    width: "100%",
    height: theme.layout.auth.inputHeight,
    backgroundColor: theme.colors.brand.mint,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.background,
    textAlign: "center",
  },
  registerButton: {
    height: theme.layout.auth.inputHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  registerText: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.brand.subtitle,
    textAlign: "center",
  },
  socialDivider: {
    width: "100%",
    height: theme.layout.auth.socialDividerHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerLine: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.background,
    opacity: 0.8,
  },
  socialRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xl,
    marginTop: -theme.spacing.xxl,
  },
  socialButton: {
    width: theme.layout.auth.socialButtonSize,
    height: theme.layout.auth.socialButtonSize,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  socialIcon: {
    width: theme.layout.auth.socialIconSize,
    height: theme.layout.auth.socialIconSize,
  },
  fakeTabBar: {
    height: theme.layout.auth.tabBarHeight,
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.tabBar,
    borderTopRightRadius: theme.radius.tabBar,
    ...theme.shadow.card,
  },
  fakeTabBarInner: {
    flex: 1,
    paddingVertical: theme.layout.auth.tabBarPaddingVertical,
  },
  fakeTabIconsRow: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: theme.spacing.xl,
    justifyContent: "space-between",
    alignItems: "center",
  },
  fakeTabItem: {
    width: theme.layout.auth.tabLabelWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  fakeTabLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.brand.inactive,
    textAlign: "center",
  },
});
