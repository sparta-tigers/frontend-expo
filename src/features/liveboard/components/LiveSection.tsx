// src/features/liveboard/components/LiveSection.tsx
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { theme } from "@/src/styles/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";

// ========================================================
// 목데이터 (상단 라이브 섹션용)
// ========================================================
const MOCK_LIVE_DATA = {
  inning: 9,
  inningHalf: "말" as "초" | "말",
  awayScore: 6,
  homeScore: 13,
  ballCount: 2,
  strikeCount: 1,
  outCount: 1,
  bases: { first: true, second: false, third: false },
  pitcherName: "이강준",
  pitchCount: 13,
  lastEvent: " [7회 말] 오선우 : 우익수 플라이 아웃",
  defenders: [
    { name: "이주형", x: 106, y: 17 },
    { name: "이강준", x: 103, y: 102 },
    { name: "박주홍", x: 15, y: 31 },
    { name: "김건희", x: 101, y: 194 },
    { name: "전태현", x: 156, y: 62 },
    { name: "송성문", x: 21, y: 92 },
    { name: "김태진", x: 44, y: 62 },
    { name: "최주환", x: 185, y: 94 },
    { name: "카디네스", x: 185, y: 31 },
  ],
  batter: { name: "오선우", x: 139, y: 178 },
  runner: { name: "김선빈", x: 186, y: 108 },
};

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
  const positionStyle = { left: x, top: y };
  return (
    <Box style={[styles.playerTag, tagStyle, positionStyle]}>
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

/**
 * LiveSection
 *
 * Why: 경기장 배경 위에 선수 배치, 좌측 정보 바, 텍스트 중계 배너를 절대좌표로 배치.
 */
export function LiveSection({
  awayTeamName,
  homeTeamName,
}: {
  awayTeamName: string;
  homeTeamName: string;
}) {
  return (
    <Box style={styles.liveSection}>
      <Box style={styles.stadiumBg} />

      <Box style={styles.eventBanner}>
        <Typography style={styles.eventBannerText} weight="bold">
          {MOCK_LIVE_DATA.lastEvent}
        </Typography>
      </Box>

      <Box style={styles.leftBar}>
        <Box style={[styles.scoreRow, styles.scoreAway]}>
          <Typography style={styles.scoreTeamLabel} weight="bold">
            {awayTeamName}
          </Typography>
          <Typography style={styles.scoreValue} weight="semibold">
            {MOCK_LIVE_DATA.awayScore}
          </Typography>
        </Box>
        <Box style={[styles.scoreRow, styles.scoreHome]}>
          <Typography style={styles.scoreTeamLabel} weight="bold">
            {homeTeamName}
          </Typography>
          <Typography style={styles.scoreValue} weight="semibold">
            {MOCK_LIVE_DATA.homeScore}
          </Typography>
        </Box>

        <Box style={styles.countBox}>
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

          <Box style={styles.bsoRow}>
            <BsoLine label="B" count={MOCK_LIVE_DATA.ballCount} max={4} />
            <BsoLine label="S" count={MOCK_LIVE_DATA.strikeCount} max={3} />
            <BsoLine label="O" count={MOCK_LIVE_DATA.outCount} max={3} />
          </Box>

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
