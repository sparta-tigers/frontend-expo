import React from "react";
import { 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { Box, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import { findTeamMeta } from "@/src/utils/team";
import { useAuth } from "@/context/AuthContext";
import { useMatchRanking } from "@/src/features/match/hooks/useMatchRanking";
import { LeagueType, RankingRowDto } from "@/src/features/match/types";

/**
 * 팀 순위 상세 화면 (`ranking_0`)
 * 
 * SSOT Policy: 화면의 모든 상태(view, year, date 등)는 Expo Router의 URL 파라미터로 관리한다.
 * Why: 딥링킹 지원 및 뒤로가기 시 상태 보존, 그리고 'Zero-Magic' 결정론적 UI 구현을 위함.
 */
export default function RankingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { myTeam } = useAuth();
  
  // URL 파라미터 추출 (SSOT)
  const params = useLocalSearchParams<{ 
    view?: "year" | "day"; 
    date?: string; 
    year?: string; 
    type?: string; 
  }>();

  // 기본값 설정 로직
  const today = React.useMemo(() => new Date().toISOString().split('T')[0].replace(/-/g, ''), []);
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  
  const viewMode = params.view || "year"; // 기본값 'year'
  const selectedDate = params.date || today;
  const selectedYear = params.year ? parseInt(params.year) : currentYear;
  const leagueType = (params.type as LeagueType) || "REGULAR";

  // 데이터 패칭 (TanStack Query)
  const { data: rankingRes, isLoading } = useMatchRanking({
    viewMode,
    year: selectedYear,
    leagueType,
    date: selectedDate
  });

  const rankings = React.useMemo(() => rankingRes?.data || [], [rankingRes?.data]);

  // 내 팀 정보 (Branding용)
  const team = findTeamMeta(myTeam);
  const brandColor = team.color;

  // 네비게이션 헬퍼 (SSOT 가이드 준수)
  const switchMode = React.useCallback((mode: "year" | "day") => {
    router.setParams({ view: mode });
  }, [router]);

  const updateYear = React.useCallback((year: number) => {
    router.setParams({ year: year.toString() });
  }, [router]);

  const updateLeague = React.useCallback((type: LeagueType) => {
    router.setParams({ type });
  }, [router]);

  const shiftDate = React.useCallback((days: number) => {
    const current = new Date(
      parseInt(selectedDate.slice(0, 4)),
      parseInt(selectedDate.slice(4, 6)) - 1,
      parseInt(selectedDate.slice(6, 8))
    );
    current.setDate(current.getDate() + days);
    const newDate = current.toISOString().split('T')[0].replace(/-/g, '');
    router.setParams({ date: newDate });
  }, [router, selectedDate]);

  return (
    <Box flex={1} bg="background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Branding Header (Zero-Magic SafeArea) */}
      <Box 
        style={{ paddingTop: insets.top }} 
        bg="background" 
        px="SCREEN"
        borderBottomWidth={StyleSheet.hairlineWidth}
        borderColor="team.neutralLight"
      >
        <Box 
          height={theme.layout.header.standardHeight} 
          flexDir="row" 
          align="center" 
          justify="space-between"
        >
          <TouchableOpacity onPress={() => router.back()} activeOpacity={theme.layout.dashboard.activeOpacity}>
            <MaterialIcons name="arrow-back-ios" size={theme.layout.header.profileIconSize} color={theme.colors.brand.subtitle} />
          </TouchableOpacity>
          
          {/* View Mode Toggle (URL-driven) */}
          <Box flexDir="row" bg="team.neutralLight" rounded="full" p="xs">
            <TouchableOpacity 
              onPress={() => switchMode("day")}
              style={[
                styles.toggleBtn, 
                viewMode === "day" ? styles.toggleBtnActive : styles.toggleBtnInactive
              ]}
            >
              <Typography 
                variant="caption" 
                color={viewMode === "day" ? "card" : "brand.subtitle"}
                weight={viewMode === "day" ? "bold" : "medium"}
              >
                일자별
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => switchMode("year")}
              style={[
                styles.toggleBtn, 
                viewMode === "year" ? styles.toggleBtnActive : styles.toggleBtnInactive
              ]}
            >
              <Typography 
                variant="caption" 
                color={viewMode === "year" ? "card" : "brand.subtitle"}
                weight={viewMode === "year" ? "bold" : "medium"}
              >
                연도별
              </Typography>
            </TouchableOpacity>
          </Box>
          <Box width={24} />
        </Box>
        
        <Box align="center" pb="md">
           <Typography variant="h1" style={styles.mascotEmoji}>
             {team?.mascotEmoji || "⚾"}
           </Typography>
           
           {/* Dynamic Title based on View Mode */}
           <Box flexDir="row" align="center" mt="xs">
             {viewMode === "day" && (
               <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.navArrow}>
                 <MaterialIcons name="chevron-left" size={24} color={theme.colors.brand.subtitle} />
               </TouchableOpacity>
             )}
             
             <Typography variant="h2" weight="bold" color="text.primary" mx="sm">
               {viewMode === "year" ? `${selectedYear} 시즌 순위` : `${selectedDate.slice(4,6)}월 ${selectedDate.slice(6,8)}일 순위`}
             </Typography>

             {viewMode === "day" && (
               <TouchableOpacity onPress={() => shiftDate(1)} style={styles.navArrow}>
                 <MaterialIcons name="chevron-right" size={24} color={theme.colors.brand.subtitle} />
               </TouchableOpacity>
             )}
           </Box>
        </Box>
      </Box>

      {/* Filter Row (Year Selector & League Toggle) */}
      <Box px="SCREEN" py="sm" flexDir="row" justify="space-between" align="center">
        {viewMode === "year" ? (
          <Box flexDir="row" gap="xs">
            {[2024, 2025, 2026].map(y => (
              <TouchableOpacity 
                key={y} 
                onPress={() => updateYear(y)}
                style={[
                  styles.yearChip,
                  selectedYear === y && styles.yearChipActive,
                  selectedYear === y && { borderColor: brandColor }
                ]}
              >
                <Typography variant="caption" weight="bold" color={selectedYear === y ? "text.primary" : "brand.subtitle"}>
                  {y}
                </Typography>
              </TouchableOpacity>
            ))}
          </Box>
        ) : (
          <Box /> // Spacing for alignment
        )}

        <Box flexDir="row" bg="team.neutralLight" rounded="full" p="xxs">
          {(["REGULAR", "PRESEASON"] as LeagueType[]).map((type) => (
            <TouchableOpacity 
              key={type}
              onPress={() => updateLeague(type)}
              style={[
                styles.leagueBtn,
                leagueType === type && { backgroundColor: theme.colors.card }
              ]}
            >
              <Typography 
                variant="caption" 
                weight="bold" 
                color={leagueType === type ? "text.primary" : "brand.subtitle"}
              >
                {type === "REGULAR" ? "정규리그" : "시범경기"}
              </Typography>
            </TouchableOpacity>
          ))}
        </Box>
      </Box>

      {/* Content Area */}
      <Box px="SCREEN" py="md" flex={1}>
        {isLoading ? (
          <Box flex={1} justify="center" align="center">
            <ActivityIndicator color={brandColor} />
            <Typography variant="caption" color="brand.subtitle" mt="sm">순위 데이터를 불러오는 중...</Typography>
          </Box>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Table Header */}
            <Box 
              flexDir="row" 
              height={theme.layout.dashboard.calendarHeaderHeight} 
              align="center" 
              borderBottomWidth={StyleSheet.hairlineWidth} 
              borderColor="team.neutralLight"
              bg="background"
            >
              <Box width={40} align="center"><Typography variant="caption" color="text.secondary">순위</Typography></Box>
              <Box flex={2}><Typography variant="caption" color="text.secondary" ml="xl">팀명</Typography></Box>
              <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">경기수</Typography></Box>
              <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">승</Typography></Box>
              <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">패</Typography></Box>
              <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">무</Typography></Box>
              <Box flex={1.5} align="center"><Typography variant="caption" color="text.secondary">승률</Typography></Box>
            </Box>

            {/* Ranking List */}
            {rankings.map((row) => {
              const isMyTeam = myTeam === row.teamCode;
              return (
                <RankingRow 
                  key={row.teamId} 
                  row={row} 
                  isMyTeam={isMyTeam} 
                />
              );
            })}
          </ScrollView>
        )}
      </Box>
    </Box>
  );
}

const RankingRow = React.memo(({ row, isMyTeam }: { row: RankingRowDto, isMyTeam: boolean }) => (
  <Box 
    flexDir="row" 
    height={52} 
    align="center"
    my="xs"
    rounded="md"
    style={isMyTeam ? styles.myTeamRow : styles.normalRow}
  >
    <Box width={40} align="center">
      <Typography variant="h3" weight="bold" color={isMyTeam ? "brand.mint" : "text.secondary"}>
        {row.rank}
      </Typography>
    </Box>
    <Box flex={2} flexDir="row" align="center">
      <Box width={32} height={32} rounded="full" bg="team.neutralLight" align="center" justify="center" mr="sm">
        <Typography style={styles.teamIconText}>
          {findTeamMeta(row.teamCode)?.mascotEmoji || "⚾"}
        </Typography>
      </Box>
      <Typography variant="body2" weight={isMyTeam ? "bold" : "medium"} color={isMyTeam ? "brand.mint" : "text.primary"}>
        {row.teamName}
      </Typography>
      {isMyTeam && (
        <Box ml="xs" bg="brand.mint" px="xs" rounded="sm">
          <Typography variant="caption" color="card" weight="bold">MY</Typography>
        </Box>
      )}
    </Box>
    <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.matchCount}</Typography></Box>
    <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.winCount}</Typography></Box>
    <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.loseCount}</Typography></Box>
    <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.drawCount}</Typography></Box>
    <Box flex={1.5} align="center">
      <Typography variant="caption" weight="bold" color="text.primary">
        {row.winRate.toFixed(3)}
      </Typography>
    </Box>
  </Box>
));
RankingRow.displayName = "RankingRow";

const styles = StyleSheet.create({
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 70,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.brand.mint,
  },
  toggleBtnInactive: {
    backgroundColor: theme.colors.transparent,
  },
  myTeamRow: {
    backgroundColor: theme.colors.background,
    borderWidth: theme.layout.dashboard.rankingMyTeamBorderWidth,
    borderColor: theme.colors.brand.mint,
  },
  normalRow: {
    borderWidth: 0,
  },
  mascotEmoji: {
    fontSize: theme.typography.size.TITLE,
  },
  teamIconText: {
    fontSize: theme.typography.size.md,
  },
  navArrow: {
    padding: 4,
  },
  yearChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: theme.colors.border.width.light,
    borderColor: theme.colors.team.neutralLight,
  },
  yearChipActive: {
    backgroundColor: theme.colors.team.neutralLight,
  },
  leagueBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
});
