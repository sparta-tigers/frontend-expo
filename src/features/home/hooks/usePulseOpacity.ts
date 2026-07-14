import { useEffect } from 'react';
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export function usePulseOpacity(min = 0.3, max = 0.7, duration = 1000) {
  const opacity = useSharedValue(min);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(max, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity, max, duration]);

  return opacity;
}
