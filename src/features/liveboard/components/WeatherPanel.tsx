// src/features/liveboard/components/WeatherPanel.tsx
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { ForeCastTable } from "@/src/features/liveboard/components/ForeCastTable";
import { NowCastCard } from "@/src/features/liveboard/components/NowCastCard";
import { WeatherApiStatus } from "@/src/features/liveboard/types";
import { filterUpcomingForeCast } from "@/src/features/liveboard/utils/weatherFormat";
import { theme } from "@/src/styles/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { useWeatherPanel } from "@/src/features/liveboard/hooks/useWeatherPanel";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";

/**
 * WeatherStatusBanner
 *
 * Why: 기상청 API 상태가 SUCCESS가 아닐 때 사용자에게 원인을 안내.
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

/**
 * WeatherPanel
 *
 * Why: 라이브보드 룸의 "구장날씨" 탭 콘텐츠. 로직은 useWeatherPanel에 위임.
 */
export function WeatherPanel({ matchId }: { matchId: string }) {
  const {
    fetchState,
    stadiumName,
    weatherStatus,
    nowCast,
    foreCast,
    isLoggedIn,
    handleRetry,
  } = useWeatherPanel(matchId);

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

  const upcoming = filterUpcomingForeCast(foreCast, new Date(), 5);

  return (
    <ScrollView
      style={styles.weatherScroll}
      contentContainerStyle={styles.weatherContent}
      showsVerticalScrollIndicator={false}
    >
      {weatherStatus !== "SUCCESS" && (
        <WeatherStatusBanner status={weatherStatus} />
      )}
      <NowCastCard stadiumName={stadiumName} nowCast={nowCast} />
      <ForeCastTable foreCast={upcoming} />
    </ScrollView>
  );
}
