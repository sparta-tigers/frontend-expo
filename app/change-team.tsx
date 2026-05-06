import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { useAuth } from "@/context/AuthContext";
import { Stack, router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";

// ========================================================
// 화면 전용 레이아웃 상수 (LOCAL_LAYOUT)
// ========================================================
const LOCAL_LAYOUT = {
  headerMarginBottom: 24,
  titleFontSize: 22,
  titleWeight: "700" as const,
  titleBottomGap: 8,
  subtitleFontSize: 14,
  cardWidth: "48%",
  cardRadius: 16,
  cardPadding: 16,
  cardBottomMargin: 16,
  cardBorderWidth: 1,
  avatarSize: 60,
  avatarRadius: 30,
  avatarBottomGap: 12,
  avatarShadowOpacity: 0.1,
  avatarShadowRadius: 8,
  avatarElevation: 3,
  mascotSize: 30,
  teamNameSize: 15,
  checkBadgeTop: 8,
  checkBadgeRight: 8,
  checkPaddingHorizontal: 6,
  checkPaddingVertical: 2,
  checkRadius: 4,
  checkFontSize: 10,
} as const;

const TEAMS = [
  { id: "KIA", name: "KIA 타이거즈", mascot: "🐯", color: theme.colors.team.kia },
  { id: "LG", name: "LG 트윈스", mascot: "👯", color: theme.colors.team.lg },
  { id: "KT", name: "KT 위즈", mascot: "🧙", color: theme.colors.team.kt },
  { id: "SSG", name: "SSG 랜더스", mascot: "🛸", color: theme.colors.team.ssg },
  { id: "NC", name: "NC 다이노스", mascot: "🦖", color: theme.colors.team.nc },
  { id: "DOOSAN", name: "두산 베어스", mascot: "🐻", color: theme.colors.team.doosan },
  { id: "LOTTE", name: "롯데 자이언츠", mascot: "⚓", color: theme.colors.team.lotte },
  { id: "SAMSUNG", name: "삼성 라이온즈", mascot: "🦁", color: theme.colors.team.samsung },
  { id: "HANWHA", name: "한화 이글스", mascot: "🦅", color: theme.colors.team.hanwha },
  { id: "KIWOOM", name: "키움 히어로즈", mascot: "🦸", color: theme.colors.team.kiwoom },
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
          headerStyle: { backgroundColor: theme.colors.background },
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
            
            // 동적 스타일 — 원시 수치 없이 LOCAL_LAYOUT 참조
            const cardDynamicStyle = isSelected ? { 
              borderColor: team.color, 
              borderWidth: 2 
            } : null;
            const badgeDynamicStyle = { backgroundColor: team.color };
            const textDynamicStyle = isSelected ? { 
              color: team.color, 
              fontWeight: "700" as const 
            } : null;

            return (
              <TouchableOpacity
                key={team.id}
                activeOpacity={0.7}
                onPress={() => handleSelectTeam(team.id)}
                style={[styles.teamCard, cardDynamicStyle]}
              >
                <Box 
                  width={LOCAL_LAYOUT.avatarSize}
                  height={LOCAL_LAYOUT.avatarSize}
                  rounded="full"
                  justify="center"
                  align="center"
                  mb="md"
                  style={[styles.colorBadge, badgeDynamicStyle]}
                >
                  <Typography style={styles.mascot}>{team.mascot}</Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  weight="semibold" 
                  center
                  style={textDynamicStyle}
                >
                  {team.name}
                </Typography>
                {isSelected && (
                  <Box 
                    rounded="sm"
                    px="xs"
                    py="xxs"
                    style={[styles.checkBadge, badgeDynamicStyle]}
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
