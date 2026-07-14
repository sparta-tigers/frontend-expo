// src/features/liveboard/components/LineupPanel.tsx
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { useLineupPanel } from '@/src/features/liveboard/hooks/useLineupPanel';
import { styles } from '@/src/features/liveboard/styles/matchId.styles';
import { LineupSection } from '@/src/shared/components/match/LineupSection';
import { theme } from '@/src/styles/theme';
import { findTeamMeta, getTeamBgStyle } from '@/src/utils/team';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';

/**
 * LineupPanel
 *
 * Why: 라이브보드 룸의 "선수 라인업" 탭 콘텐츠. 로직은 useLineupPanel에 위임.
 */
import { MatchDetail } from '@/src/shared/types/match';

/**
 * LineupPanel
 *
 * Why: 라이브보드 룸의 "선수 라인업" 탭 콘텐츠. 로직은 useLineupPanel에 위임.
 */
export function LineupPanel({ match }: { match: MatchDetail }) {
  const { matchId, homeTeam, awayTeam } = match;
  const homeTeamName = homeTeam.name;
  const awayTeamName = awayTeam.name;

  const {
    activeTeam,
    setActiveTeam,
    fetchState,
    currentLineup,
    currentTeamName,
    isLoggedIn,
    handleRetry,
  } = useLineupPanel(matchId.toString(), homeTeamName, awayTeamName);

  if (fetchState === 'LOADING') {
    return (
      <Box flex={1} align="center" justify="center" gap="md">
        <ActivityIndicator size="small" color={theme.colors.brand.mint} />
        <Typography variant="body1" color="text.secondary" weight="medium">
          라인업을 불러오는 중이에요
        </Typography>
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

  if (fetchState === 'ERROR') {
    const errorMessage = !isLoggedIn ? '로그인이 필요해요' : '라인업을 불러오지 못했어요';

    return (
      <Box flex={1} align="center" justify="center" gap="md">
        <MaterialIcons name="error-outline" size={40} color={theme.colors.text.tertiary} />
        <Typography variant="body1" color="text.secondary" weight="medium">
          {errorMessage}
        </Typography>
        {isLoggedIn ? (
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
        ) : null}
      </Box>
    );
  }

  return (
    <ScrollView
      style={styles.lineupScroll}
      contentContainerStyle={styles.lineupContent}
      showsVerticalScrollIndicator={false}
    >
      <Box flexDir="row" justify="center" gap="sm" py="md">
        <TouchableOpacity
          style={[
            styles.chip,
            activeTeam === 'HOME' ? getTeamBgStyle(homeTeamName) : styles.chipInactive,
          ]}
          onPress={() => setActiveTeam('HOME')}
          accessibilityRole="button"
          accessibilityLabel="홈팀 라인업 보기"
        >
          <Typography
            style={activeTeam === 'HOME' ? styles.chipTextActive : styles.chipTextInactive}
            weight="semibold"
          >
            {homeTeamName}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            activeTeam === 'AWAY' ? getTeamBgStyle(awayTeamName) : styles.chipInactive,
          ]}
          onPress={() => setActiveTeam('AWAY')}
          accessibilityRole="button"
          accessibilityLabel="어웨이팀 라인업 보기"
        >
          <Typography
            style={activeTeam === 'AWAY' ? styles.chipTextActive : styles.chipTextInactive}
            weight="semibold"
          >
            {awayTeamName}
          </Typography>
        </TouchableOpacity>
      </Box>

      <LineupSection lineup={currentLineup} teamMeta={findTeamMeta(currentTeamName)} />
    </ScrollView>
  );
}
