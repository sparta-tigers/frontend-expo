// app/liveboard/[matchId].tsx
// Why: Expo Router는 파일명을 라우트 경로로 사용하므로 이 파일은 유지해야 함.
// 실제 로직·UI·스타일은 [matchId]/ 하위 모듈에 위임.
import { Box } from "@/components/ui/box";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { ChatPanel } from "./[matchId]/ChatPanel";
import { LineupPanel } from "./[matchId]/LineupPanel";
import { LiveSection } from "./[matchId]/LiveSection";
import { WeatherPanel } from "./[matchId]/WeatherPanel";
import { styles } from "./[matchId]/matchId.styles";

/**
 * 라이브보드 탭 키 집합
 * Why: 허용 가능한 탭 상태를 유니온으로 제한해 잘못된 문자열 유입을
 *      컴파일 단계에서 차단하기 위함.
 */
type TabKey = "chat" | "text" | "lineup" | "weather";

const TABS: { key: TabKey; label: string }[] = [
  { key: "chat", label: "라이브채팅" },
  { key: "text", label: "텍스트 중계" },
  { key: "lineup", label: "선수 라인업" },
  { key: "weather", label: "구장날씨" },
];

/**
 * PlaceholderPanelProps
 * Why: 미구현 탭에서 노출할 안내 문구 계약을 명시해 재사용성과 타입 안정성을 유지하기 위함.
 */
interface PlaceholderPanelProps {
  label: string;
}

/**
 * 준비 중인 탭의 임시 콘텐츠 패널
 * Why: 미구현 상태에서도 사용자에게 일관된 피드백을 제공해 빈 화면 인지를 방지하기 위함.
 */
function PlaceholderPanel({ label }: PlaceholderPanelProps) {
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
 * 탭 상태 관리와 라우트 파라미터 접근만 담당. 각 탭 콘텐츠는 하위 모듈에 위임.
 */
export default function LiveboardDetailScreen() {
  const params = useLocalSearchParams<{
    matchId: string;
    awayTeamName?: string;
    homeTeamName?: string;
    stadium?: string;
    matchTime?: string;
  }>();

  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  return (
    <SafeLayout style={styles.container} edges={["left", "right"]}>
      <LiveSection
        awayTeamName={params.awayTeamName ?? "어웨이"}
        homeTeamName={params.homeTeamName ?? "홈"}
      />

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
        {activeTab === "chat" && <ChatPanel matchId={params.matchId} />}
        {activeTab === "text" && <PlaceholderPanel label="텍스트 중계" />}
        {activeTab === "lineup" && (
          <LineupPanel
            matchId={params.matchId}
            homeTeamName={params.homeTeamName ?? "홈"}
            awayTeamName={params.awayTeamName ?? "어웨이"}
          />
        )}
        {activeTab === "weather" && <WeatherPanel matchId={params.matchId} />}
      </Box>
    </SafeLayout>
  );
}
