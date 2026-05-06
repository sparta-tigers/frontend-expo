import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { useAuth } from "@/context/AuthContext";
import { Stack, router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { getTeamBorderStyle } from "@/src/utils/team";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerMarginBottom: theme.spacing.xxl,
  titleFontSize: theme.typography.size.SECTION_TITLE,
  titleWeight: theme.typography.weight.bold,
  titleBottomGap: theme.spacing.sm,
  subtitleFontSize: theme.typography.size.md,
  cardWidth: "48%",
  cardRadius: theme.radius.lg,
  cardPadding: theme.spacing.lg,
  cardBottomMargin: theme.spacing.lg,
  cardBorderWidth: 1,
  avatarSize: 60,
  avatarRadius: 30,
  avatarBottomGap: theme.spacing.md,
  avatarShadowOpacity: 0.1,
  avatarShadowRadius: theme.spacing.sm,
  avatarElevation: 3,
  mascotSize: 30,
  teamNameSize: theme.typography.size.md,
  checkBadgeTop: theme.spacing.sm,
  checkBadgeRight: theme.spacing.sm,
  checkPaddingHorizontal: 6,
  checkPaddingVertical: 2,
  checkRadius: theme.radius.sm,
  checkFontSize: theme.typography.size.xs,
} as const;

const TEAMS = [
  { id: "KIA", name: "KIA 타이거즈", mascot: "🐯", colorPath: "team.kia" as const },
  { id: "LG", name: "LG 트윈스", mascot: "👯", colorPath: "team.lg" as const },
  { id: "KT", name: "KT 위즈", mascot: "🧙", colorPath: "team.kt" as const },
  { id: "SSG", name: "SSG 랜더스", mascot: "🛸", colorPath: "team.ssg" as const },
  { id: "NC", name: "NC 다이노스", mascot: "🦖", colorPath: "team.nc" as const },
  { id: "DOOSAN", name: "두산 베어스", mascot: "🐻", colorPath: "team.doosan" as const },
  { id: "LOTTE", name: "롯데 자이언츠", mascot: "⚓", colorPath: "team.lotte" as const },
  { id: "SAMSUNG", name: "삼성 라이온즈", mascot: "🦁", colorPath: "team.samsung" as const },
  { id: "HANWHA", name: "한화 이글스", mascot: "🦅", colorPath: "team.hanwha" as const },
  { id: "KIWOOM", name: "키움 히어로즈", mascot: "🦸", colorPath: "team.kiwoom" as const },
];

/**
 * 응원팀 변경 화면
 * 
 * Why: 사용자의 소속 팀을 변경하고, 그에 따른 앱 테마 색상을 동적으로 적용하기 위함.
 * Zero-Magic UI 원칙에 따라 모든 수치는 LOCAL_LAYOUT 및 theme 토큰을 참조함.
 */
export default function ChangeTeamScreen() {
  const { myTeam, updateMyTeam } = useAuth();

  const handleSelectTeam = async (teamId: string) => {
    await updateMyTeam(teamId);
    router.back();
  };

  return (
    <SafeLayout style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "응원팀 변경",
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Box mb="xxl">
          <Typography 
            variant="h3" 
            weight="bold" 
            mb="sm"
          >
            응원하는 팀을 선택해주세요
          </Typography>
          <Typography variant="body2" color="text.secondary">
            선택한 팀에 맞춰 앱의 테마 색상이 변경됩니다.
          </Typography>
        </Box>

        <Box flexDir="row" flexWrap="wrap" justify="space-between">
          {TEAMS.map((team) => {
            const isSelected = myTeam === team.id;
            
            return (
              <TouchableOpacity
                key={team.id}
                activeOpacity={0.7}
                onPress={() => handleSelectTeam(team.id)}
                style={[
                  styles.teamCard,
                  isSelected && styles.teamCardSelected,
                  isSelected && getTeamBorderStyle(team.name)
                ]}
              >
                <Box 
                  width={LOCAL_LAYOUT.avatarSize}
                  height={LOCAL_LAYOUT.avatarSize}
                  rounded="full"
                  justify="center"
                  align="center"
                  mb="md"
                  bg={team.colorPath}
                  style={styles.colorBadge}
                >
                  <Typography style={styles.mascot}>{team.mascot}</Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  weight={isSelected ? "bold" : "semibold"} 
                  center
                  color={isSelected ? team.colorPath : "primary"}
                >
                  {team.name}
                </Typography>
                {isSelected && (
                  <Box 
                    rounded="sm"
                    px="xs"
                    py="xxs"
                    bg={team.colorPath}
                    style={styles.checkBadge}
                  >
                    <Typography 
                      color="background" 
                      weight="bold"
                      style={styles.checkText}
                    >
                      선택됨
                    </Typography>
                  </Box>
                )}
              </TouchableOpacity>
            );
          })}
        </Box>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.layout.dashboard.screenPaddingHorizontal,
  },
  teamCard: {
    width: LOCAL_LAYOUT.cardWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: LOCAL_LAYOUT.cardRadius,
    padding: LOCAL_LAYOUT.cardPadding,
    marginBottom: LOCAL_LAYOUT.cardBottomMargin,
    alignItems: "center",
    borderWidth: LOCAL_LAYOUT.cardBorderWidth,
    borderColor: theme.colors.border.light,
  },
  teamCardSelected: {
    borderWidth: 2,
  },
  colorBadge: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: LOCAL_LAYOUT.avatarShadowOpacity,
    shadowRadius: LOCAL_LAYOUT.avatarShadowRadius,
    elevation: LOCAL_LAYOUT.avatarElevation,
  },
  mascot: {
    fontSize: LOCAL_LAYOUT.mascotSize,
  },
  checkBadge: {
    position: "absolute",
    top: LOCAL_LAYOUT.checkBadgeTop,
    right: LOCAL_LAYOUT.checkBadgeRight,
  },
  checkText: {
    fontSize: LOCAL_LAYOUT.checkFontSize,
  },
});
