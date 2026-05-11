import { Box } from "@/components/ui/box";
import { SafeLayout } from "@/components/ui/safe-layout";
import { Typography } from "@/components/ui/typography";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import { theme } from "@/src/styles/theme";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { LineupSection } from "@/src/features/home/components/LineupSection";
import {
  fetchMatchLineup,
  fetchMatchWeather,
} from "@/src/features/liveboard/api";
import { ForeCastTable } from "@/src/features/liveboard/components/ForeCastTable";
import { NowCastCard } from "@/src/features/liveboard/components/NowCastCard";
import {
  ForeCastDto,
  LineupRowDto,
  NowCastDto,
  WeatherApiStatus,
} from "@/src/features/liveboard/types";
import { filterUpcomingForeCast } from "@/src/features/liveboard/utils/weatherFormat";
import { getTeamBgStyle } from "@/src/utils/team";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";

// ========================================================
// 목데이터 (상단 라이브 섹션용)
// ========================================================
const MOCK_LIVE_DATA = {
  inning: 9,
  inningHalf: "말" as "초" | "말",
  awayScore: 6,
  homeScore: 13,
  ballCount: 2, // 0~4
  strikeCount: 1, // 0~3
  outCount: 1, // 0~3
  bases: { first: true, second: false, third: false },
  pitcherName: "이강준",
  pitchCount: 13,
  lastEvent: " [7회 말] 오선우 : 우익수 플라이 아웃",
  // 수비 9명 (디자인 기준 절대좌표, 좌상단 기준 px)
  defenders: [
    { name: "이주형", x: 106, y: 17 }, // 투수
    { name: "이강준", x: 103, y: 102 }, // 포수
    { name: "박주홍", x: 15, y: 31 }, // 좌익수
    { name: "김건희", x: 101, y: 194 }, // 중견수
    { name: "전태현", x: 156, y: 62 }, // 우익수
    { name: "송성문", x: 21, y: 92 }, // 3루수
    { name: "김태진", x: 44, y: 62 }, // 유격수
    { name: "최주환", x: 185, y: 94 }, // 2루수
    { name: "카디네스", x: 185, y: 31 }, // 1루수
  ],
  // 타자/주자
  batter: { name: "오선우", x: 139, y: 178 },
  runner: { name: "김선빈", x: 186, y: 108 },
};

/**
 * 라이브보드 채팅 버블 메시지 (UI 렌더링용)
 */
interface ChatBubbleMessage {
  /** 중복 방지 키 (optimistic: `local-{timestamp}`, 서버 수신: `senderId-sentAt-content`) */
  key: string;
  senderId: number | null;
  author: string;
  text: string;
  time: string; // HH:mm
  mine: boolean;
}

/**
 * 서버 STOMP 수신 메시지 DTO (ChatMessage.java와 매칭)
 */
interface StompChatMessage {
  roomId: string;
  senderId: number;
  senderNickname: string;
  content: string;
  sentAt: string; // ISO
  domain: "LIVEBOARD" | "EXCHANGE" | "LOCATION";
  favTeamSymbolUrl?: string | null;
}

// ========================================================
// 탭 정의
// ========================================================
type TabKey = "chat" | "text" | "lineup" | "weather";
const TABS: { key: TabKey; label: string }[] = [
  { key: "chat", label: "라이브채팅" },
  { key: "text", label: "텍스트 중계" },
  { key: "lineup", label: "선수 라인업" },
  { key: "weather", label: "구장날씨" },
];

// ========================================================
// 메인 화면
// ========================================================

/**
 * 라이브보드 상세 화면
 *
 * Why: 매치 카드 클릭 시 이동하는 실시간 경기 중계 화면.
 * - 상단: 경기장 + 선수 배치 + 점수/BSO/베이스/투수 정보 (현재는 목데이터)
 * - 중간: 4탭 네비게이션 (라이브채팅/텍스트중계/선수라인업/구장날씨)
 * - 하단: 선택된 탭의 컨텐츠 (라이브채팅만 구현, 나머지는 placeholder)
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
      {/* ─ 상단: 라이브 중계 시각화 ─────────────────────────── */}
      <LiveSection
        awayTeamName={params.awayTeamName ?? "어웨이"}
        homeTeamName={params.homeTeamName ?? "홈"}
      />

      {/* ─ 중간: 탭 네비게이션 ─────────────────────────────── */}
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

      {/* ─ 하단: 탭 컨텐츠 ─────────────────────────────────── */}
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

// ========================================================
// 상단: 라이브 섹션 (목데이터 기반 시각화)
// ========================================================

/**
 * LiveSection
 *
 * Why: 경기장 배경 위에 선수 배치, 좌측 정보 바, 텍스트 중계 배너를 절대좌표로 배치.
 * 디자인 기준 너비(290px 선수 영역, 74px 좌측 바)를 그대로 유지하되,
 * 화면 너비가 더 클 경우 좌우 중앙 정렬은 섹션 내부에서 해결.
 */
function LiveSection({
  awayTeamName,
  homeTeamName,
}: {
  awayTeamName: string;
  homeTeamName: string;
}) {
  return (
    <Box style={styles.liveSection}>
      {/* 경기장 배경 (목업: 그린톤 단색) */}
      <Box style={styles.stadiumBg} />

      {/* 텍스트 중계 배너 */}
      <Box style={styles.eventBanner}>
        <Typography style={styles.eventBannerText} weight="bold">
          {MOCK_LIVE_DATA.lastEvent}
        </Typography>
      </Box>

      {/* 좌측 정보 바 */}
      <Box style={styles.leftBar}>
        {/* 점수 — 어웨이 */}
        <Box style={[styles.scoreRow, styles.scoreAway]}>
          <Typography style={styles.scoreTeamLabel} weight="bold">
            {awayTeamName}
          </Typography>
          <Typography style={styles.scoreValue} weight="semibold">
            {MOCK_LIVE_DATA.awayScore}
          </Typography>
        </Box>
        {/* 점수 — 홈 */}
        <Box style={[styles.scoreRow, styles.scoreHome]}>
          <Typography style={styles.scoreTeamLabel} weight="bold">
            {homeTeamName}
          </Typography>
          <Typography style={styles.scoreValue} weight="semibold">
            {MOCK_LIVE_DATA.homeScore}
          </Typography>
        </Box>

        {/* 볼카운트/이닝 통합 박스 */}
        <Box style={styles.countBox}>
          {/* 이닝 + 베이스 */}
          <Box style={styles.inningRow} flexDir="row" align="center">
            <Box align="center">
              <MaterialIcons
                name="arrow-drop-up"
                size={14}
                color={
                  MOCK_LIVE_DATA.inningHalf === "초"
                    ? theme.colors.background
                    : theme.colors.transparent
                }
              />
              <Typography style={styles.inningText} weight="semibold">
                {MOCK_LIVE_DATA.inning}
              </Typography>
              <MaterialIcons
                name="arrow-drop-down"
                size={14}
                color={
                  MOCK_LIVE_DATA.inningHalf === "말"
                    ? theme.colors.background
                    : theme.colors.transparent
                }
              />
            </Box>
            <Box style={styles.baseDiamond}>
              <Box
                style={[
                  styles.base,
                  styles.baseSecond,
                  MOCK_LIVE_DATA.bases.second && styles.baseActive,
                ]}
              />
              <Box
                style={[
                  styles.base,
                  styles.baseThird,
                  MOCK_LIVE_DATA.bases.third && styles.baseActive,
                ]}
              />
              <Box
                style={[
                  styles.base,
                  styles.baseFirst,
                  MOCK_LIVE_DATA.bases.first && styles.baseActive,
                ]}
              />
            </Box>
          </Box>

          {/* BSO */}
          <Box style={styles.bsoRow}>
            <BsoLine label="B" count={MOCK_LIVE_DATA.ballCount} max={4} />
            <BsoLine label="S" count={MOCK_LIVE_DATA.strikeCount} max={3} />
            <BsoLine label="O" count={MOCK_LIVE_DATA.outCount} max={3} />
          </Box>

          {/* 투수 정보 */}
          <Box style={styles.pitcherBox} align="center">
            <Typography style={styles.pitcherName} weight="medium">
              {MOCK_LIVE_DATA.pitcherName}
            </Typography>
            <Typography style={styles.pitcherPitchLabel}>
              투구수{" "}
              <Typography style={styles.pitcherPitchCount} weight="semibold">
                {MOCK_LIVE_DATA.pitchCount}
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 선수 배치 영역 */}
      <Box style={styles.playerArea}>
        {MOCK_LIVE_DATA.defenders.map((p) => (
          <PlayerTag
            key={p.name}
            name={p.name}
            x={p.x}
            y={p.y}
            kind="defender"
          />
        ))}
        <PlayerTag
          name={MOCK_LIVE_DATA.batter.name}
          x={MOCK_LIVE_DATA.batter.x}
          y={MOCK_LIVE_DATA.batter.y}
          kind="batter"
        />
        <PlayerTag
          name={MOCK_LIVE_DATA.runner.name}
          x={MOCK_LIVE_DATA.runner.x}
          y={MOCK_LIVE_DATA.runner.y}
          kind="runner"
        />
      </Box>
    </Box>
  );
}

/**
 * PlayerTag — 선수 이름 태그 (수비/타자/주자 색상 구분)
 */
function PlayerTag({
  name,
  x,
  y,
  kind,
}: {
  name: string;
  x: number;
  y: number;
  kind: "defender" | "batter" | "runner";
}) {
  const tagStyle =
    kind === "defender"
      ? styles.playerTagDefender
      : kind === "batter"
        ? styles.playerTagBatter
        : styles.playerTagRunner;
  const textStyle =
    kind === "runner" ? styles.playerNameRunner : styles.playerName;
  return (
    <Box style={[styles.playerTag, tagStyle, { left: x, top: y }]}>
      <Typography style={textStyle} weight="medium">
        {name}
      </Typography>
    </Box>
  );
}

/**
 * BsoLine — B/S/O 각 라인 (label + 점 표시)
 */
function BsoLine({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  return (
    <Box flexDir="row" align="center" style={styles.bsoLine}>
      <Typography style={styles.bsoLabel} weight="regular">
        {label}
      </Typography>
      <Box flexDir="row" style={styles.bsoDots}>
        {Array.from({ length: max }).map((_, i) => (
          <Box
            key={i}
            style={[styles.bsoDot, i < count && getBsoDotActiveStyle(label)]}
          />
        ))}
      </Box>
    </Box>
  );
}

function getBsoDotActiveStyle(label: string) {
  if (label === "B") return styles.bsoDotBall;
  if (label === "S") return styles.bsoDotStrike;
  return styles.bsoDotOut;
}

// ========================================================
// 하단: 라이브 채팅 패널 (STOMP 1:N 실시간 채팅)
// ========================================================

/**
 * 서버 수신 메시지에서 UI 메시지로 변환
 * 중복 방지 키: senderId-sentAt-content 조합 (서버가 messageId를 안 주므로)
 */
function toBubbleMessage(
  msg: StompChatMessage,
  myUserId: number | undefined,
): ChatBubbleMessage {
  const time = new Date(msg.sentAt).toTimeString().slice(0, 5); // HH:mm
  return {
    key: `${msg.senderId}-${msg.sentAt}-${msg.content}`,
    senderId: msg.senderId,
    author: msg.senderNickname,
    text: msg.content,
    time,
    mine: myUserId !== undefined && msg.senderId === myUserId,
  };
}

/**
 * ChatPanel
 *
 * Why: 라이브보드 1:N STOMP 채팅.
 * - 구독: `/server/liveboard/room/LIVEBOARD_{matchId}`
 * - 전송: `/client/liveboard/send` with { roomId, content }
 * - 메시지 영속화 없음 → 세션 동안만 로컬 state로 관리
 * - optimistic update로 전송 즉시 내 메시지 노출, 실패 시 롤백
 */
function ChatPanel({ matchId }: { matchId: string }) {
  const { user } = useAuth();
  const roomId = `LIVEBOARD_${matchId}`;
  const { client, status } = useWebSocket(roomId, "liveboard");
  const isConnected = status === "CONNECTED";

  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView | null>(null);

  // 구독: 새 메시지 수신 시 목록에 추가 + optimistic 대체
  useEffect(() => {
    if (!client || !isConnected) return;

    const subscription = client.subscribe(
      `/server/liveboard/room/${roomId}`,
      (frame) => {
        try {
          const parsed = JSON.parse(frame.body) as StompChatMessage;
          const bubble = toBubbleMessage(parsed, user?.userId);

          setMessages((prev) => {
            // 내가 보낸 optimistic 메시지 대체 (local- 접두사 키)
            const withoutOptimistic = bubble.mine
              ? prev.filter(
                  (m) =>
                    !(
                      m.key.startsWith("local-") &&
                      m.senderId === bubble.senderId &&
                      m.text === bubble.text
                    ),
                )
              : prev;

            // 중복 방지
            if (withoutOptimistic.some((m) => m.key === bubble.key)) {
              return withoutOptimistic;
            }
            return [...withoutOptimistic, bubble];
          });
        } catch {
          // 파싱 실패한 메시지는 무시
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, isConnected, roomId, user?.userId]);

  // 새 메시지 도착 시 하단 스크롤
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content) return;

    if (!client || !isConnected) {
      Alert.alert(
        "연결 오류",
        "서버와 연결이 불안정합니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    if (!user?.userId) {
      Alert.alert("로그인 필요", "메시지를 전송하려면 로그인이 필요합니다.");
      return;
    }

    // optimistic update
    const localKey = `local-${Date.now()}`;
    const optimistic: ChatBubbleMessage = {
      key: localKey,
      senderId: user.userId,
      author: user.nickname ?? "나",
      text: content,
      time: new Date().toTimeString().slice(0, 5),
      mine: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      client.publish({
        destination: "/client/liveboard/send",
        body: JSON.stringify({ roomId, content }),
      });
    } catch {
      // 전송 실패 → optimistic 제거
      setMessages((prev) => prev.filter((m) => m.key !== localKey));
      Alert.alert("전송 실패", "메시지 전송에 실패했습니다.");
    }
  }, [client, draft, isConnected, roomId, user]);

  return (
    <Box flex={1}>
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <Box flex={1} align="center" justify="center" py="xxxl">
            <Typography variant="body1" color="text.tertiary" weight="medium">
              {isConnected ? "첫 메시지를 남겨보세요" : "채팅 연결 중..."}
            </Typography>
          </Box>
        ) : (
          messages.map(({ key, ...rest }) => <ChatBubble key={key} {...rest} />)
        )}
      </ScrollView>

      {/* 입력창 */}
      <Box style={styles.chatInputWrap}>
        <Box style={styles.chatInput} flexDir="row" align="center">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="메시지 보내기..."
            placeholderTextColor={theme.colors.brand.inactive}
            style={styles.chatInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={isConnected}
          />
        </Box>
        <TouchableOpacity
          style={styles.chatSendBtn}
          onPress={handleSend}
          disabled={!isConnected || !draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="전송"
        >
          <MaterialIcons
            name="arrow-upward"
            size={16}
            color={theme.colors.background}
          />
        </TouchableOpacity>
      </Box>
    </Box>
  );
}

function ChatBubble({
  author,
  text,
  time,
  mine,
}: {
  author: string;
  text: string;
  time: string;
  mine: boolean;
}) {
  return (
    <Box
      flexDir="row"
      align="flex-end"
      justify={mine ? "flex-end" : "flex-start"}
      style={styles.bubbleRow}
    >
      {mine && (
        <Typography style={styles.bubbleTime} weight="regular">
          {time}
        </Typography>
      )}
      <Box style={styles.bubbleColumn} align={mine ? "flex-end" : "flex-start"}>
        <Typography style={styles.bubbleAuthor} weight="regular">
          {author}
        </Typography>
        <Box
          style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
        >
          <Typography
            style={mine ? styles.bubbleTextMine : styles.bubbleTextOther}
            weight="semibold"
          >
            {text}
          </Typography>
        </Box>
      </Box>
      {!mine && (
        <Typography style={styles.bubbleTime} weight="regular">
          {time}
        </Typography>
      )}
    </Box>
  );
}

// ========================================================
// 하단: 선수 라인업 패널 (홈/어웨이 칩 토글 + LineupSection 재사용)
// ========================================================

type ActiveTeam = "HOME" | "AWAY";
type FetchState = "LOADING" | "SUCCESS" | "ERROR";

/**
 * LineupPanel
 *
 * Why: 라이브보드 룸의 "선수 라인업" 탭 콘텐츠.
 * - 마운트 시 GET /api/liveboard/{matchId}/lineup 1회 호출
 * - 홈/어웨이 칩 토글로 표시 팀 전환 (추가 네트워크 호출 없음)
 * - LineupSection 재사용 (props만 교체, 인스턴스 유지)
 * - cancelled 플래그로 비동기 경합 방어
 */
function LineupPanel({
  matchId,
  homeTeamName,
  awayTeamName,
}: {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const { user } = useAuth();
  const isLoggedIn = !!user?.userId;

  const [activeTeam, setActiveTeam] = useState<ActiveTeam>("HOME");
  const [fetchState, setFetchState] = useState<FetchState>("LOADING");
  const [homeBatters, setHomeBatters] = useState<LineupRowDto[]>([]);
  const [awayBatters, setAwayBatters] = useState<LineupRowDto[]>([]);

  // 데이터 페칭: 마운트 / matchId 변경 / 재시도 시 단일 진입점
  const loadLineup = useCallback(
    (cancelled: { current: boolean }) => {
      if (!isLoggedIn) {
        setFetchState("ERROR");
        return;
      }

      setFetchState("LOADING");

      fetchMatchLineup(matchId)
        .then((data) => {
          if (cancelled.current) return;
          if (!isLoggedIn) return;
          setHomeBatters(data.homeBatters ?? []);
          setAwayBatters(data.awayBatters ?? []);
          setFetchState("SUCCESS");
        })
        .catch(() => {
          if (cancelled.current) return;
          setFetchState("ERROR");
        });
    },
    [matchId, isLoggedIn],
  );

  useEffect(() => {
    const cancelled = { current: false };
    loadLineup(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [loadLineup]);

  const handleRetry = useCallback(() => {
    const cancelled = { current: false };
    loadLineup(cancelled);
  }, [loadLineup]);

  // 현재 선택된 팀의 라인업과 팀명
  const currentLineup = activeTeam === "HOME" ? homeBatters : awayBatters;
  const currentTeamName = activeTeam === "HOME" ? homeTeamName : awayTeamName;

  // 로딩 상태
  if (fetchState === "LOADING") {
    return (
      <Box flex={1} align="center" justify="center" gap="md">
        <ActivityIndicator size="small" color={theme.colors.brand.mint} />
        <Typography variant="body1" color="text.secondary" weight="medium">
          라인업을 불러오는 중이에요
        </Typography>
        {/* 칩 비활성 상태로 표시 */}
        <Box flexDir="row" gap="sm" mt="md">
          <Box style={[styles.chip, styles.chipInactive]}>
            <Typography style={styles.chipTextInactive} weight="semibold">
              {homeTeamName}
            </Typography>
          </Box>
          <Box style={[styles.chip, styles.chipInactive]}>
            <Typography style={styles.chipTextInactive} weight="semibold">
              {awayTeamName}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // 에러 상태
  if (fetchState === "ERROR") {
    const errorMessage = !isLoggedIn
      ? "로그인이 필요합니다"
      : "라인업을 불러오지 못했어요";

    return (
      <Box flex={1} align="center" justify="center" gap="md">
        <MaterialIcons
          name="error-outline"
          size={40}
          color={theme.colors.text.tertiary}
        />
        <Typography variant="body1" color="text.secondary" weight="medium">
          {errorMessage}
        </Typography>
        {isLoggedIn && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Typography style={styles.retryBtnText} weight="semibold">
              다시 시도
            </Typography>
          </TouchableOpacity>
        )}
      </Box>
    );
  }

  // 성공 상태: 칩 + LineupSection
  return (
    <ScrollView
      style={styles.lineupScroll}
      contentContainerStyle={styles.lineupContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 팀 칩 토글 */}
      <Box flexDir="row" justify="center" gap="sm" py="md">
        <TouchableOpacity
          style={[
            styles.chip,
            activeTeam === "HOME"
              ? getTeamBgStyle(homeTeamName)
              : styles.chipInactive,
          ]}
          onPress={() => setActiveTeam("HOME")}
          accessibilityRole="button"
          accessibilityLabel="홈팀 라인업 보기"
        >
          <Typography
            style={
              activeTeam === "HOME"
                ? styles.chipTextActive
                : styles.chipTextInactive
            }
            weight="semibold"
          >
            {homeTeamName}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            activeTeam === "AWAY"
              ? getTeamBgStyle(awayTeamName)
              : styles.chipInactive,
          ]}
          onPress={() => setActiveTeam("AWAY")}
          accessibilityRole="button"
          accessibilityLabel="어웨이팀 라인업 보기"
        >
          <Typography
            style={
              activeTeam === "AWAY"
                ? styles.chipTextActive
                : styles.chipTextInactive
            }
            weight="semibold"
          >
            {awayTeamName}
          </Typography>
        </TouchableOpacity>
      </Box>

      {/* LineupSection 재사용 (인스턴스 유지, props만 교체) */}
      <LineupSection lineup={currentLineup} teamName={currentTeamName} />
    </ScrollView>
  );
}

// ========================================================
// 하단: 구장날씨 패널 (NowCast + ForeCast 단일 호출)
// ========================================================

/**
 * WeatherPanel
 *
 * Why: 라이브보드 룸의 "구장날씨" 탭 콘텐츠.
 * - 마운트 시 GET /api/liveboard/{matchId}/weather 1회 호출
 * - 응답: { stadiumName, status, nowCast, foreCast } 구조
 * - status가 SUCCESS가 아니면 원인에 맞는 안내 메시지를 표시
 * - ForeCast는 렌더링 전에 "현재 시각 이후 가장 가까운 5개"로 필터링
 * - cancelled 플래그로 비동기 경합 방어 (LineupPanel과 동일 패턴)
 */
function WeatherPanel({ matchId }: { matchId: string }) {
  const { user } = useAuth();
  const isLoggedIn = !!user?.userId;

  const [fetchState, setFetchState] = useState<FetchState>("LOADING");
  const [stadiumName, setStadiumName] = useState<string | null>(null);
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherApiStatus>("SUCCESS");
  const [nowCast, setNowCast] = useState<NowCastDto | null>(null);
  const [foreCast, setForeCast] = useState<ForeCastDto[]>([]);

  // 데이터 페칭: 마운트 / matchId 변경 / 재시도 시 단일 진입점
  const loadWeather = useCallback(
    (cancelled: { current: boolean }) => {
      if (!isLoggedIn) {
        setFetchState("ERROR");
        return;
      }

      setFetchState("LOADING");

      fetchMatchWeather(matchId)
        .then((data) => {
          if (cancelled.current) return;
          if (!isLoggedIn) return;
          setStadiumName(data.stadiumName ?? null);
          setWeatherStatus(data.status ?? "SUCCESS");
          setNowCast(data.nowCast ?? null);
          setForeCast(data.foreCast ?? []);
          setFetchState("SUCCESS");
        })
        .catch(() => {
          if (cancelled.current) return;
          setFetchState("ERROR");
        });
    },
    [matchId, isLoggedIn],
  );

  useEffect(() => {
    const cancelled = { current: false };
    loadWeather(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [loadWeather]);

  const handleRetry = useCallback(() => {
    const cancelled = { current: false };
    loadWeather(cancelled);
  }, [loadWeather]);

  // 로딩 상태
  if (fetchState === "LOADING") {
    return (
      <Box flex={1} align="center" justify="center" gap="md">
        <ActivityIndicator size="small" color={theme.colors.brand.mint} />
        <Typography variant="body1" color="text.secondary" weight="medium">
          날씨를 불러오는 중이에요
        </Typography>
      </Box>
    );
  }

  // 에러 상태 (네트워크/서버 오류)
  if (fetchState === "ERROR") {
    const errorMessage = !isLoggedIn
      ? "로그인이 필요합니다"
      : "날씨를 불러오지 못했어요";

    return (
      <Box flex={1} align="center" justify="center" gap="md">
        <MaterialIcons
          name="cloud-off"
          size={40}
          color={theme.colors.text.tertiary}
        />
        <Typography variant="body1" color="text.secondary" weight="medium">
          {errorMessage}
        </Typography>
        {isLoggedIn && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Typography style={styles.retryBtnText} weight="semibold">
              다시 시도
            </Typography>
          </TouchableOpacity>
        )}
      </Box>
    );
  }

  // 성공 상태: 기상청 API 상태에 따른 배너 + NowCast 카드 + ForeCast 테이블
  const upcoming = filterUpcomingForeCast(foreCast, new Date(), 5);

  return (
    <ScrollView
      style={styles.weatherScroll}
      contentContainerStyle={styles.weatherContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 기상청 API 상태 배너 — SUCCESS가 아닐 때만 표시 */}
      {weatherStatus !== "SUCCESS" && (
        <WeatherStatusBanner status={weatherStatus} />
      )}
      <NowCastCard stadiumName={stadiumName} nowCast={nowCast} />
      <ForeCastTable foreCast={upcoming} />
    </ScrollView>
  );
}

/**
 * WeatherStatusBanner
 *
 * Why: 기상청 API 상태가 SUCCESS가 아닐 때 사용자에게 원인을 안내한다.
 * 데이터가 없거나 오래된 것처럼 보여도 "앱 버그"가 아님을 명확히 전달.
 */
function WeatherStatusBanner({ status }: { status: WeatherApiStatus }) {
  const message =
    status === "NO_DATA"
      ? "기상청 데이터 준비 중이에요 (발표 전 또는 점검 중)"
      : status === "UPSTREAM_ERROR"
        ? "기상청 서버 점검 중이에요. 잠시 후 다시 확인해주세요"
        : "날씨 데이터를 불러오는 중 오류가 발생했어요";

  return (
    <Box
      style={styles.weatherStatusBanner}
      flexDir="row"
      align="center"
      gap="sm"
    >
      <MaterialIcons
        name="info-outline"
        size={16}
        color={theme.colors.brand.mint}
      />
      <Typography style={styles.weatherStatusText} weight="medium">
        {message}
      </Typography>
    </Box>
  );
}

// ========================================================
// 하단: 플레이스홀더 패널 (텍스트 중계)
// ========================================================
function PlaceholderPanel({ label }: { label: string }) {
  return (
    <Box flex={1} align="center" justify="center" gap="sm">
      <MaterialIcons
        name="construction"
        size={40}
        color={theme.colors.text.tertiary}
      />
      <Typography variant="body1" color="text.secondary" weight="medium">
        {label} 준비 중입니다
      </Typography>
    </Box>
  );
}

// ========================================================
// Styles
// ========================================================

// 디자인 기준 섹션 수치 (Figma)
const LIVE_SECTION_HEIGHT = 274;
const LEFT_BAR_WIDTH = 74;
const LEFT_BAR_LEFT = 13;
const PLAYER_AREA_LEFT = 102;
const PLAYER_AREA_TOP = 53;
const PLAYER_AREA_WIDTH = 290;
const PLAYER_AREA_HEIGHT = 223;

// 이 화면 전용 색상 (theme로 승격할만큼 범용성 없음)
// Why: ESLint no-color-literals 회피 + 상단 라이브 섹션은 시각화 전용이라
// theme 토큰으로 묶기 애매한 색상(반투명/BSO 신호등 등)이 많음.
const LIVE_COLORS = {
  stadiumBg: "#2F5D3F",
  scoreAway: "rgba(87,5,20,0.7)",
  scoreHome: "rgba(234,0,41,0.7)",
  countBoxBg: "rgba(255,255,255,0.38)",
  baseIdle: "rgba(78,78,78,0.85)",
  baseActive: "rgba(247,247,247,0.85)",
  bsoDotIdle: "rgba(255,255,255,0.3)",
  bsoBall: "#4CAF50",
  bsoStrike: "#FFC107",
  bsoOut: "#F44336",
  defender: "#277F7F",
  batter: "#333333",
  runner: "rgba(255,255,255,0.92)",
  runnerText: "#333333",
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.brand.background,
  },

  // ── 라이브 섹션 (상단) ───────────────────────────────
  liveSection: {
    height: LIVE_SECTION_HEIGHT,
    overflow: "hidden",
    position: "relative",
  },
  stadiumBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // 목업 배경: 경기장 느낌의 짙은 그린
    backgroundColor: LIVE_COLORS.stadiumBg,
  },
  eventBanner: {
    position: "absolute",
    top: 27,
    left: 120,
    paddingHorizontal: 32,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: theme.colors.brand.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  eventBannerText: {
    fontSize: 11,
    color: theme.colors.background,
    textAlign: "center",
    letterSpacing: -0.55,
  },

  // ── 좌측 바 ──────────────────────────────────────────
  leftBar: {
    position: "absolute",
    top: 0,
    left: LEFT_BAR_LEFT,
    width: LEFT_BAR_WIDTH,
    height: LIVE_SECTION_HEIGHT,
  },
  scoreRow: {
    position: "absolute",
    left: 0,
    width: LEFT_BAR_WIDTH,
    height: 30,
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  scoreAway: {
    top: 27,
    backgroundColor: LIVE_COLORS.scoreAway,
  },
  scoreHome: {
    top: 57,
    backgroundColor: LIVE_COLORS.scoreHome,
  },
  scoreTeamLabel: {
    fontSize: 10,
    color: theme.colors.background,
  },
  scoreValue: {
    fontSize: 20,
    color: theme.colors.background,
    letterSpacing: -1,
  },
  countBox: {
    position: "absolute",
    top: 97,
    left: 4,
    width: LEFT_BAR_WIDTH - 4,
    height: 165,
    borderRadius: 3,
    backgroundColor: LIVE_COLORS.countBoxBg,
    padding: 6,
    gap: 4,
  },
  inningRow: {
    gap: 4,
  },
  inningText: {
    fontSize: 16,
    color: theme.colors.background,
    textAlign: "center",
  },
  baseDiamond: {
    position: "relative",
    width: 36,
    height: 36,
    marginLeft: 6,
  },
  base: {
    position: "absolute",
    width: 10,
    height: 10,
    backgroundColor: LIVE_COLORS.baseIdle,
    transform: [{ rotate: "45deg" }],
  },
  baseSecond: { top: 0, left: 13 },
  baseFirst: { top: 13, left: 22 },
  baseThird: { top: 13, left: 4 },
  baseActive: {
    backgroundColor: LIVE_COLORS.baseActive,
  },
  bsoRow: {
    gap: 2,
    marginTop: 2,
  },
  bsoLine: {
    gap: 4,
  },
  bsoLabel: {
    fontSize: 11,
    color: theme.colors.background,
    width: 10,
  },
  bsoDots: {
    gap: 2,
  },
  bsoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIVE_COLORS.bsoDotIdle,
  },
  bsoDotBall: { backgroundColor: LIVE_COLORS.bsoBall },
  bsoDotStrike: { backgroundColor: LIVE_COLORS.bsoStrike },
  bsoDotOut: { backgroundColor: LIVE_COLORS.bsoOut },
  pitcherBox: {
    marginTop: 4,
    gap: 2,
  },
  pitcherName: {
    fontSize: 11,
    color: theme.colors.background,
    textAlign: "center",
  },
  pitcherPitchLabel: {
    fontSize: 11,
    color: theme.colors.background,
    textAlign: "center",
  },
  pitcherPitchCount: {
    fontSize: 11,
    color: theme.colors.brand.mint,
  },

  // ── 선수 배치 영역 ────────────────────────────────────
  playerArea: {
    position: "absolute",
    top: PLAYER_AREA_TOP,
    left: PLAYER_AREA_LEFT,
    width: PLAYER_AREA_WIDTH,
    height: PLAYER_AREA_HEIGHT,
  },
  playerTag: {
    position: "absolute",
    width: 47,
    height: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playerTagDefender: {
    backgroundColor: LIVE_COLORS.defender,
  },
  playerTagBatter: {
    backgroundColor: LIVE_COLORS.batter,
  },
  playerTagRunner: {
    backgroundColor: LIVE_COLORS.runner,
  },
  playerName: {
    fontSize: 9,
    color: theme.colors.background,
    textAlign: "center",
    lineHeight: 13,
  },
  playerNameRunner: {
    fontSize: 9,
    color: LIVE_COLORS.runnerText,
    textAlign: "center",
    lineHeight: 13,
  },

  // ── 탭 바 ─────────────────────────────────────────────
  tabBar: {
    height: 30,
    paddingHorizontal: 33,
    backgroundColor: theme.colors.brand.background,
    shadowColor: theme.colors.team.kt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
  },
  tabItem: {
    width: 59,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 12,
    color: theme.colors.brand.inactive,
    textAlign: "center",
  },
  tabTextActive: {
    color: theme.colors.brand.mint,
  },

  // ── 채팅 패널 ────────────────────────────────────────
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 14,
    gap: 15,
  },
  bubbleRow: {
    gap: 2,
    maxWidth: "100%",
  },
  bubbleColumn: {
    gap: 2,
    maxWidth: 240,
  },
  bubbleAuthor: {
    fontSize: 13,
    color: theme.colors.team.neutralDark,
    paddingHorizontal: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: theme.colors.team.kt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5.25,
    elevation: 1,
  },
  bubbleOther: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleMine: {
    backgroundColor: theme.colors.brand.mint,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleTextOther: {
    fontSize: 14,
    color: theme.colors.team.neutralDark,
  },
  bubbleTextMine: {
    fontSize: 14,
    color: theme.colors.background,
  },
  bubbleTime: {
    fontSize: 10,
    color: theme.colors.brand.subtitle,
    paddingBottom: 4,
  },

  // ── 채팅 입력창 ──────────────────────────────────────
  chatInputWrap: {
    height: 66,
    paddingHorizontal: 12,
    paddingTop: 0,
    position: "relative",
  },
  chatInput: {
    height: 39,
    borderRadius: 15,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 17,
    shadowColor: theme.colors.team.kt,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  chatInputText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.team.neutralDark,
  },
  chatSendBtn: {
    position: "absolute",
    right: 24,
    top: 7,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: theme.colors.brand.mint,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── 라인업 패널 ──────────────────────────────────────
  lineupScroll: {
    flex: 1,
  },
  lineupContent: {
    paddingBottom: 30,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  chipInactive: {
    backgroundColor: theme.colors.card,
  },
  chipTextActive: {
    fontSize: 13,
    color: theme.colors.background,
  },
  chipTextInactive: {
    fontSize: 13,
    color: theme.colors.brand.inactive,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.brand.mint,
  },
  retryBtnText: {
    fontSize: 13,
    color: theme.colors.background,
  },

  // ── 구장날씨 패널 ────────────────────────────────────
  weatherScroll: {
    flex: 1,
  },
  weatherContent: {
    paddingBottom: 30,
  },
  weatherStatusBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.brand.mint,
  },
  weatherStatusText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
