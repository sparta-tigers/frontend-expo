import { Box } from "@/components/ui/box";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { ChatPanel } from "@/src/features/liveboard/components/ChatPanel";
import { LineupPanel } from "@/src/features/liveboard/components/LineupPanel";
import { LiveSection } from "@/src/features/liveboard/components/LiveSection";
import { WeatherPanel } from "@/src/features/liveboard/components/WeatherPanel";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";
import { useLiveboardScreen, TABS } from "@/src/features/liveboard/hooks/useLiveboardScreen";
import { theme } from "@/src/styles/theme";
import React from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";

// ... (PlaceholderPanel component remains same)

/**
 * PlaceholderPanel
 *
 * Why: 아직 개발 중이거나 데이터가 없는 탭의 화면을 일관된 디자인으로 표시하기 위한 임시 패널.
 * 탭 전환 시 사용자에게 빈 화면 대신 "준비 중" 상태를 명확히 인지시킴.
 */
function PlaceholderPanel({ label }: { label: string }) {
  return (
    <Box flex={1} align="center" justify="center" gap="sm">
      <Typography variant="body1" color="text.secondary" weight="medium">
        {label} 준비 중입니다
      </Typography>
    </Box>
  );
}

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

  if (isError || (!isLoading.match && !match)) {
    return (
      <SafeLayout style={styles.container} edges={["left", "right"]}>
        <Box flex={1} justify="center" align="center">
          <Typography color="error">
            경기 정보를 불러오지 못했습니다.
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

        {activeTab === "text" && (
          <Box style={[styles.tabPanel, styles.visible]}>
            <PlaceholderPanel label="텍스트 중계" />
          </Box>
        )}
        {activeTab === "lineup" && match && (
          <Box style={[styles.tabPanel, styles.visible]}>
            <LineupPanel match={match} />
          </Box>
        )}
        {activeTab === "weather" && (
          <Box style={[styles.tabPanel, styles.visible]}>
            <WeatherPanel matchId={matchId} />
          </Box>
        )}
      </Box>
    </SafeLayout>
  );
}
