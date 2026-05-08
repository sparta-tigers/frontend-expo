import { Box, Typography } from "@/components/ui";
import { theme } from "@/src/styles/theme";
import { Stack, router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TEAM_DATA, TeamCode } from "@/src/utils/team";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFakeHomeData } from "@/src/features/home/mocks";

// ========================================================
// 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerHeight: 60,
  tableHeaderHeight: 40,
  rowHeight: 52,
} as const;

// ========================================================
// [SHARED] 브랜딩 헤더 컴포넌트
// ========================================================
const BrandingHeader: React.FC<{ teamCode: TeamCode }> = ({ teamCode }) => {
  const insets = useSafeAreaInsets();
  const team = TEAM_DATA[teamCode] || TEAM_DATA["KIA"];

  return (
    <Box 
      style={{ paddingTop: insets.top }} 
      bg="background" 
      px="SCREEN"
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderColor="team.neutralLight"
    >
      <Box 
        height={LOCAL_LAYOUT.headerHeight} 
        flexDir="row" 
        align="center" 
        justify="space-between"
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back-ios" size={24} color={theme.colors.brand.subtitle} />
        </TouchableOpacity>
        
        <Box flexDir="row" align="center">
          <Typography variant="h2" weight="bold" color="text.primary" mr="xs">
            {team.shortName.toUpperCase()}
          </Typography>
          <Typography variant="h2" weight="bold" color="team.kia">
            TIGERS
          </Typography>
        </Box>

        <Box width={24} />
      </Box>
      
      <Box align="center" pb="md">
         <Typography variant="h1" style={styles.mascotEmoji}>
           {team.mascotEmoji}
         </Typography>
      </Box>
    </Box>
  );
};

/**
 * 리그 순위 화면 (`ranking_0`)
 * 
 * Why: KBO 리그의 전체 순위표를 제공하며, 내 응원팀의 위치를 하이라이트하여 보여줌.
 * 경기 일정(Schedule)과는 별개의 도메인 파일로 관리하여 응집도를 높임.
 */
export default function RankingScreen() {
  const { myTeam: myTeamId } = useAuth();
  const activeTeamCode = (myTeamId as TeamCode) || "KIA";
  
  // 목 데이터 활용 (내 응원팀 하이라이트 로직 포함)
  const { rankingSummary: ranking } = useFakeHomeData(activeTeamCode);

  return (
    <Box flex={1} bg="background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Branded Header */}
      <BrandingHeader teamCode={activeTeamCode} />

      {/* Filter Bar (이미지 1 기획 반영) */}
      <Box px="SCREEN" py="md">
        <Box flexDir="row" justify="space-between" align="center" mb="md">
          {/* View Toggle: 순위 화면이므로 '연도별'이 활성화됨 */}
          <Box flexDir="row" bg="team.neutralLight" rounded="full" p="xs">
            <TouchableOpacity 
              onPress={() => router.replace("/schedule")}
              style={[styles.toggleBtn, styles.toggleBtnInactive]}
            >
              <Typography variant="caption" color="brand.subtitle">일자별</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, styles.toggleBtnActive]}>
              <Typography variant="caption" color="card" weight="bold">연도별</Typography>
            </TouchableOpacity>
          </Box>

          {/* Year Selector */}
          <Box flexDir="row" align="center">
            <MaterialIcons name="chevron-left" size={24} color={theme.colors.text.secondary} />
            <Typography variant="h3" weight="bold" mx="sm">2026년</Typography>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
          </Box>

          {/* League Dropdown */}
          <Box px="sm" py="xs" borderWidth={1} borderColor="brand.mint" rounded="md">
            <Typography variant="caption" color="brand.mint" weight="bold">정규리그 ∨</Typography>
          </Box>
        </Box>

        {/* Table Header */}
        <Box 
          flexDir="row" 
          height={LOCAL_LAYOUT.tableHeaderHeight} 
          align="center" 
          borderBottomWidth={1} 
          borderColor="team.neutralLight"
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {ranking.map((row) => {
            const isMyTeam = activeTeamCode && (row.team.shortName === TEAM_DATA[activeTeamCode]?.shortName);
            
            return (
              <Box 
                key={row.team.shortName}
                flexDir="row" 
                height={LOCAL_LAYOUT.rowHeight} 
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
                    <Typography style={styles.teamIconText}>{row.team.mascotEmoji}</Typography>
                  </Box>
                  <Typography variant="body2" weight={isMyTeam ? "bold" : "medium"} color={isMyTeam ? "brand.mint" : "text.primary"}>
                    {row.team.name}
                  </Typography>
                </Box>
                <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.games}</Typography></Box>
                <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.win}</Typography></Box>
                <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.lose}</Typography></Box>
                <Box flex={1} align="center"><Typography variant="caption" color="text.secondary">{row.draw}</Typography></Box>
                <Box flex={1.5} align="center">
                  <Typography variant="caption" weight="bold" color="text.primary">
                    {row.winRate.toFixed(3)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </ScrollView>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.brand.mint,
  },
  toggleBtnInactive: {
    // backgroundColor: "transparent",
  },
  myTeamRow: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.brand.mint,
  },
  normalRow: {
    // backgroundColor: "transparent",
    borderWidth: 0,
  },
  mascotEmoji: {
    fontSize: 40,
  },
  teamIconText: {
    fontSize: 16,
  },
});
