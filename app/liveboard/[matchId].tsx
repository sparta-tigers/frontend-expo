import { Box } from '@/components/ui/box';
import { SafeLayout } from '@/components/ui/safe-layout';
import { Typography } from '@/components/ui/typography';
import { ChatPanel } from '@/src/features/liveboard/components/ChatPanel';
import { LineupPanel } from '@/src/features/liveboard/components/LineupPanel';
import { LiveSection } from '@/src/features/liveboard/components/LiveSection';
import { TextBroadcastPanel } from '@/src/features/liveboard/components/TextBroadcastPanel';
import { WeatherPanel } from '@/src/features/liveboard/components/WeatherPanel';
import { TABS, useLiveboardScreen } from '@/src/features/liveboard/hooks/useLiveboardScreen';
import { styles } from '@/src/features/liveboard/styles/matchId.styles';
import { theme } from '@/src/styles/theme';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';

/**
 * 라이브보드 상세 화면
 *
 * Why: 매치 카드 클릭 시 이동하는 실시간 경기 중계 화면.
 * useLiveboardScreen 파사드 훅을 단일 진입점(SSOT)으로 삼아 데이터를 수급받음.
 * 뷰는 오직 렌더링에만 집중하며, 복잡한 로직이나 useEffect 체인을 포함하지 않음.
 */
export default function LiveboardDetailScreen() {
  const { matchId, match, liveData, activeTab, setActiveTab, isLoading, isError, isValidMatchId } =
    useLiveboardScreen();

  const { width } = useWindowDimensions();
  const tabIndex = TABS.findIndex((t) => t.key === activeTab);
  const [slideAnim] = useState(() => new Animated.Value(tabIndex));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [tabIndex, slideAnim]);

  // 🚨 Step 1: matchId 유효성 검사 (Fail-fast)
  if (!isValidMatchId) {
    return (
      <SafeLayout style={styles.container} edges={['left', 'right']}>
        <Box flex={1} justify="center" align="center" px="xl">
          <Typography color="error" variant="h3" weight="bold" center>
            잘못된 접근이에요.
          </Typography>
          <Typography color="text.secondary" mt="sm" center>
            유효하지 않은 경기 식별자(ID)예요.
          </Typography>
        </Box>
      </SafeLayout>
    );
  }

  // 🚀 Step 2: 정적 경기 정보(match) 로드 실패 시에만 전체 에러 화면 표시
  if (isError.match && !match) {
    return (
      <SafeLayout style={styles.container} edges={['left', 'right']}>
        <Box flex={1} justify="center" align="center" px="xl">
          <Typography color="error" variant="h3" weight="bold">
            경기 정보를 불러오지 못했어요
          </Typography>
          <Typography color="text.secondary" mt="sm" center>
            매치 데이터를 불러오는 중 문제가 생겼어요.
          </Typography>
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.container} edges={['left', 'right']}>
      {match ? (
        <LiveSection match={match} liveData={liveData} isLiveLoading={isLoading.live} />
      ) : (
        <Box align="center" justify="center" style={localStyles.loaderContainer}>
          <ActivityIndicator color={theme.colors.brand.mint} />
        </Box>
      )}

      <Box style={styles.tabBar} flexDir="row" justify="space-between">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <Typography style={[styles.tabText, isActive && styles.tabTextActive]} weight="bold">
                {tab.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </Box>

      <Box flex={1} overflow="hidden">
        <Animated.View
          style={[
            localStyles.animatedContainer,
            {
              width: width * TABS.length,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: TABS.map((_, i) => i),
                    outputRange: TABS.map((_, i) => -width * i),
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <Box
            style={[localStyles.tabPanel, { width }]}
            accessibilityElementsHidden={activeTab !== 'chat'}
            importantForAccessibility={activeTab !== 'chat' ? 'no-hide-descendants' : 'auto'}
          >
            {activeTab === 'chat' && <ChatPanel matchId={matchId} />}
          </Box>

          <Box
            style={[localStyles.tabPanel, { width }]}
            accessibilityElementsHidden={activeTab !== 'text'}
            importantForAccessibility={activeTab !== 'text' ? 'no-hide-descendants' : 'auto'}
          >
            <TextBroadcastPanel
              inningTexts={liveData?.inningTexts}
              isVisible={activeTab === 'text'}
            />
          </Box>

          <Box
            style={[localStyles.tabPanel, { width }]}
            accessibilityElementsHidden={activeTab !== 'lineup'}
            importantForAccessibility={activeTab !== 'lineup' ? 'no-hide-descendants' : 'auto'}
          >
            {activeTab === 'lineup' && match && <LineupPanel match={match} />}
          </Box>

          <Box
            style={[localStyles.tabPanel, { width }]}
            accessibilityElementsHidden={activeTab !== 'weather'}
            importantForAccessibility={activeTab !== 'weather' ? 'no-hide-descendants' : 'auto'}
          >
            {activeTab === 'weather' && <WeatherPanel matchId={matchId} />}
          </Box>
        </Animated.View>
      </Box>
    </SafeLayout>
  );
}

const localStyles = StyleSheet.create({
  loaderContainer: {
    width: '100%',
    aspectRatio: 360 / 274,
  },
  animatedContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabPanel: {
    flex: 1,
  },
});
