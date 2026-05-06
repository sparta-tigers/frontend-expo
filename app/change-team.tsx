import { Box, Typography } from "@/components/ui";
import { SafeLayout } from "@/components/ui/safe-layout";
import { theme } from "@/src/styles/theme";
import { useAuth } from "@/context/AuthContext";
import { Stack, router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";

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
        <Box style={styles.header}>
          <Typography style={styles.title}>응원하는 팀을 선택해주세요</Typography>
          <Typography style={styles.subtitle}>선택한 팀에 맞춰 앱의 테마 색상이 변경됩니다.</Typography>
        </Box>

        <Box style={styles.grid}>
          {TEAMS.map((team) => {
            const isSelected = myTeam === team.id;
            return (
              <TouchableOpacity
                key={team.id}
                activeOpacity={0.7}
                onPress={() => handleSelectTeam(team.id)}
                style={[
                  styles.teamCard,
                  isSelected && { borderColor: team.color, borderWidth: 2 } // eslint-disable-line react-native/no-inline-styles
                ]}
              >
                <Box style={[styles.colorBadge, { backgroundColor: team.color }]}>
                  <Typography style={styles.mascot}>{team.mascot}</Typography>
                </Box>
                <Typography style={[styles.teamName, isSelected && { color: team.color, fontWeight: "700" }]}> {/* eslint-disable-line react-native/no-inline-styles */}
                  {team.name}
                </Typography>
                {isSelected && (
                  <Box style={[styles.checkBadge, { backgroundColor: team.color }]}>
                    <Typography style={styles.checkText}>선택됨</Typography>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  teamCard: {
    width: "48%",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  colorBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mascot: {
    fontSize: 30,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkText: {
    fontSize: 10,
    color: theme.colors.background,
    fontWeight: "700",
  },
});
