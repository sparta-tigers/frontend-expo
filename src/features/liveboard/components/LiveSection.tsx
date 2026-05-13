// src/features/liveboard/components/LiveSection.tsx
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { theme } from "@/src/styles/theme";
import { MatchDetail } from "@/src/features/match/types";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";


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
 * MatchDetail 모델을 통해 홈/어웨이 팀 정보 및 경기 상태를 중앙에서 관리함.
 */
export function LiveSection({ match }: { match: MatchDetail }) {
  const { homeTeam, awayTeam } = match;

  return (
    <Box style={styles.liveSection}>
      <Box style={styles.stadiumBg} />

      <Box style={styles.eventBanner}>
        <Typography style={styles.eventBannerText} weight="bold">
          {match.lastEvent || "진행 중인 이벤트가 없습니다"}
        </Typography>
      </Box>

      <Box style={styles.leftBar}>
        <Box style={[styles.scoreRow, styles.scoreAway]}>
          <Typography style={styles.scoreTeamLabel} weight="bold">
            {awayTeam.name}
          </Typography>
          <Typography style={styles.scoreValue} weight="semibold">
            {match.awayScore ?? 0}
          </Typography>
        </Box>
        <Box style={[styles.scoreRow, styles.scoreHome]}>
          <Typography style={styles.scoreTeamLabel} weight="bold">
            {homeTeam.name}
          </Typography>
          <Typography style={styles.scoreValue} weight="semibold">
            {match.homeScore ?? 0}
          </Typography>
        </Box>

        <Box style={styles.countBox}>
          <Box style={styles.inningRow} flexDir="row" align="center">
            <Box align="center">
              <MaterialIcons
                name="arrow-drop-up"
                size={14}
                color={
                  match.inningHalf === "초"
                    ? theme.colors.background
                    : theme.colors.transparent
                }
              />
              <Typography style={styles.inningText} weight="semibold">
                {match.inning || "-"}
              </Typography>
              <MaterialIcons
                name="arrow-drop-down"
                size={14}
                color={
                  match.inningHalf === "말"
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
                  !!match.bases?.second && styles.baseActive,
                ]}
              />
              <Box
                style={[
                  styles.base,
                  styles.baseThird,
                  !!match.bases?.third && styles.baseActive,
                ]}
              />
              <Box
                style={[
                  styles.base,
                  styles.baseFirst,
                  !!match.bases?.first && styles.baseActive,
                ]}
              />
            </Box>
          </Box>

          <Box style={styles.bsoRow}>
            <BsoLine label="B" count={match.ballCount || 0} max={4} />
            <BsoLine label="S" count={match.strikeCount || 0} max={3} />
            <BsoLine label="O" count={match.outCount || 0} max={3} />
          </Box>

          <Box style={styles.pitcherBox} align="center">
            <Typography style={styles.pitcherName} weight="medium">
              {match.pitcherName || "-"}
            </Typography>
            <Typography style={styles.pitcherPitchLabel}>
              투구수{" "}
              <Typography style={styles.pitcherPitchCount} weight="semibold">
                {match.pitchCount || 0}
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box style={styles.playerArea}>
        {match.defenders?.map((p) => (
          <PlayerTag
            key={p.name}
            name={p.name}
            x={p.x}
            y={p.y}
            kind="defender"
          />
        ))}
        {match.batter && (
          <PlayerTag
            name={match.batter.name}
            x={match.batter.x}
            y={match.batter.y}
            kind="batter"
          />
        )}
        {match.runner && (
          <PlayerTag
            name={match.runner.name}
            x={match.runner.x}
            y={match.runner.y}
            kind="runner"
          />
        )}
      </Box>
    </Box>
  );
}
