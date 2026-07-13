// theme imported removed because it's unused
import * as Haptics from 'expo-haptics';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Android 환경에서 LayoutAnimation 활성화 (필수)
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

/**
 * 전역 LayoutAnimation 유틸리티 (UI/UX Pro Max)
 * 상태 변경 직전에 호출하여 부드러운 상태(레이아웃) 변화를 유도합니다.
 * 컴포넌트 내부에서 하드코딩된 LayoutAnimation을 중앙에서 관리합니다.
 */
export const animateLayout = () => {
  // 기본 easeInEaseOut 사용. 필요시 theme.motion.duration을 조합한 Custom Config 사용 가능.
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};

/**
 * 전역 Haptic 피드백 유틸리티 (UI/UX Pro Max)
 * 미지원 기기 등에서 발생하는 예외를 안전하게 삼켜(graceful degradation)
 * 앱 크래시를 방지합니다.
 * @param style Haptics 스타일 (기본: Light)
 */
export const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
  Haptics.impactAsync(style).catch(() => {
    // 미지원 기기 무시
  });
};
