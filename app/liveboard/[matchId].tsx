import { Box } from "@/components/ui/box";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { ChatPanel } from "@/src/features/liveboard/components/ChatPanel";
import { LineupPanel } from "@/src/features/liveboard/components/LineupPanel";
import { LiveSection } from "@/src/features/liveboard/components/LiveSection";
import { TextBroadcastPanel } from "@/src/features/liveboard/components/TextBroadcastPanel";
import { WeatherPanel } from "@/src/features/liveboard/components/WeatherPanel";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";
import { useLiveboardScreen, TABS } from "@/src/features/liveboard/hooks/useLiveboardScreen";
import { theme } from "@/src/styles/theme";
import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";


/**
 * 라이브보드 상세 화면
 *
 * Why: 매치 카드 클릭 시 이동하는 실시간 경기 중계 화면.
 * useLiveboardScreen 파사드 훅을 단일 진입점(SSOT)으로 삼아 데이터를 수급받음.
 * 뷰는 오직 렌더링에만 집중하며, 복잡한 로직이나 useEffect 체인을 포함하지 않음.
 */
export default function LiveboardDetailScreen() {
  const {
    matchId,
    match,
    liveData,
    activeTab,
    setActiveTab,
    isLoading,
    isError,
    isValidMatchId,
  } = useLiveboardScreen();

  // 🚨 Step 1: matchId 유효성 검사 (Fail-fast)
  if (!isValidMatchId) {
    return (
      <SafeLayout style={styles.container} edges={["left", "right"]}>
        <Box flex={1} justify="center" align="center" px="xl">
          <Typography color="error" variant="h3" weight="bold" center>
            잘못된 접근입니다.
          </Typography>
          <Typography color="text.secondary" mt="sm" center>
            유효하지 않은 경기 식별자(ID)입니다.
          </Typography>
        </Box>
      </SafeLayout>
    );
  }

  // 🚀 Step 2: 정적 경기 정보(match) 로드 실패 시에만 전체 에러 화면 표시
  if (isError.match && !match) {
    return (
      <SafeLayout style={styles.container} edges={["left", "right"]}>
        <Box flex={1} justify="center" align="center" px="xl">
          <Typography color="error" variant="h3" weight="bold">
            경기 정보 오류
          </Typography>
          <Typography color="text.secondary" mt="sm" center>
            매치 데이터를 불러오는 중 에러가 발생했습니다.
          </Typography>
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.container} edges={["left", "right"]}>
      {match ? (
        <LiveSection 
          match={match} 
          liveData={liveData} 
          isLiveLoading={isLoading.live} 
        />
      ) : (
        <Box py="xxl" align="center">
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
              <Typography
                style={[styles.tabText, isActive && styles.tabTextActive]}
                weight="bold"
              >
                {tab.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </Box>

      <Box flex={1}>
        <Box
          style={[
            styles.tabPanel,
            activeTab === "chat" ? styles.visible : styles.hidden,
          ]}
        >
          <ChatPanel matchId={matchId} />
        </Box>

        <Box
          style={[
            styles.tabPanel,
            activeTab === "text" ? styles.visible : styles.hidden,
          ]}
        >
          <TextBroadcastPanel 
            inningTexts={liveData?.inningTexts} 
            isVisible={activeTab === "text"} 
          />
        </Box>
        <Box
          style={[
            styles.tabPanel,
            activeTab === "lineup" ? styles.visible : styles.hidden,
          ]}
        >
          {match && <LineupPanel match={match} />}
        </Box>

        <Box
          style={[
            styles.tabPanel,
            activeTab === "weather" ? styles.visible : styles.hidden,
          ]}
        >
          <WeatherPanel matchId={matchId} />
        </Box>
      </Box>
    </SafeLayout>
  );
}
