// theme imported removed because it's unused
import * as Haptics from 'expo-haptics';

/**
 * 전역 LayoutAnimation 유틸리티 (UI/UX Pro Max)
 * 상태 변경 직전에 호출하여 부드러운 상태(레이아웃) 변화를 유도합니다.
 * 컴포넌트 내부에서 하드코딩된 LayoutAnimation을 중앙에서 관리합니다.
 */
export const animateLayout = () => {
  // 🚨 [Fabric 대응] New Architecture (Fabric) 환경에서
  // LayoutAnimation.configureNext는 react-native-screens 전환 시
  // "Unable to find viewState for tag X" 크래시를 유발하므로 비활성화합니다.
  // 참고: https://github.com/react/react-native/issues/49077
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
