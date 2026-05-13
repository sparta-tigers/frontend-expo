import { Box } from "@/components/ui/box";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { ChatPanel } from "@/src/features/liveboard/components/ChatPanel";
import { LineupPanel } from "@/src/features/liveboard/components/LineupPanel";
import { LiveSection } from "@/src/features/liveboard/components/LiveSection";
import { WeatherPanel } from "@/src/features/liveboard/components/WeatherPanel";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";
import { useMatchDetail } from "@/src/features/match/hooks/useMatchDetail";
import { theme } from "@/src/styles/theme";
import { useAuth } from "@/src/hooks/useAuth";
import { TeamCode } from "@/src/utils/team";

// ... (TabKey type and TABS constant remain same)
type TabKey = "chat" | "text" | "lineup" | "weather";

const TABS: { key: TabKey; label: string }[] = [
  { key: "chat", label: "라이브채팅" },
  { key: "text", label: "텍스트 중계" },
  { key: "lineup", label: "선수 라인업" },
  { key: "weather", label: "구장날씨" },
];

/**
 * PlaceholderPanel
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
 * useMatchDetail을 단일 진입점(SSOT)으로 삼아 모든 하위 컴포넌트에 일관된 데이터를 배분함.
 */
export default function LiveboardDetailScreen() {
  const { myTeam } = useAuth();
  const myTeamCode = (myTeam as TeamCode) ?? null;

  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const idNum = parseInt(matchId || "0");
  const isValidMatchId = !isNaN(idNum) && idNum > 0;

  const { data: match, isLoading, isError } = useMatchDetail(
    isValidMatchId ? idNum : 0,
    myTeamCode
  );
  const [activeTab, setActiveTab] = useState<TabKey>("chat");

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

  if (isLoading) {
    return (
      <SafeLayout style={styles.container} edges={["left", "right"]}>
        <Box flex={1} justify="center" align="center">
          <ActivityIndicator size="large" color={theme.colors.brand.mint} />
          <Typography mt="md" color="text.secondary">경기 정보를 불러오는 중...</Typography>
        </Box>
      </SafeLayout>
    );
  }

  if (isError || !match) {
    return (
      <SafeLayout style={styles.container} edges={["left", "right"]}>
        <Box flex={1} justify="center" align="center">
          <Typography color="error">경기 정보를 불러오지 못했습니다.</Typography>
        </Box>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout style={styles.container} edges={["left", "right"]}>
      <LiveSection match={match} />

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
        {/* 🚨 앙드레 카파시: ChatPanel은 WebSocket 연결 유지를 위해 항상 마운트 상태를 유지함 (display: none 제어) */}
        <Box style={[styles.tabPanel, activeTab === "chat" ? styles.visible : styles.hidden]}>
          <ChatPanel matchId={matchId || ""} />
        </Box>

        {/* 🚨 나머지 탭들은 불필요한 API 호출 및 렌더링 방지를 위해 조건부 렌더링(&&) 적용 */}
        {activeTab === "text" && (
          <Box style={[styles.tabPanel, styles.visible]}>
            <PlaceholderPanel label="텍스트 중계" />
          </Box>
        )}
        {activeTab === "lineup" && (
          <Box style={[styles.tabPanel, styles.visible]}>
            <LineupPanel match={match} />
          </Box>
        )}
        {activeTab === "weather" && (
          <Box style={[styles.tabPanel, styles.visible]}>
            <WeatherPanel matchId={matchId || ""} />
          </Box>
        )}
      </Box>
    </SafeLayout>
  );
}
