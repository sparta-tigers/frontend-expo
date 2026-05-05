/**
 * 교환 화면 지도 오버레이 컴포넌트
 *
 * FAB 버튼 그룹 + 상단 오버레이 버튼 + 재검색 버튼을 캡슐화.
 * 지도 위에 floating으로 표시되는 모든 인터랙션 요소를 담당.
 */
import { theme } from "@/src/styles/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/** 오버레이 전용 레이아웃 상수 */
const OVERLAY_LAYOUT = {
  fabSize: 56,
  fabIconSize: 24,
  fabSpacing: 70,
  pillRadius: 24,
  reSearchOffset: 64,
} as const;

interface ExchangeMapOverlayProps {
  /** SafeArea 상단 inset (노치 대응) */
  topInset: number;
  /** 프로필 모달 열림 여부 (FAB 숨김 조건) */
  isProfileModalVisible: boolean;
  /** 지도 이동 여부 (재검색 버튼 표시 조건) */
  isMapMoved: boolean;
  /** 위치 이동 버튼 핸들러 */
  onMoveToLocation: () => void;
  /** 프로필 FAB 핸들러 */
  onOpenProfile: () => void;
  /** 등록하기 버튼 핸들러 */
  onNavigateToCreate: () => void;
  /** 교환현황 버튼 핸들러 */
  onNavigateToRequests: () => void;
  /** 현 지도에서 재검색 핸들러 */
  onSearchCurrentLocation: () => void;
}

export const ExchangeMapOverlay = React.memo(
  ({
    topInset,
    isProfileModalVisible,
    isMapMoved,
    onMoveToLocation,
    onOpenProfile,
    onNavigateToCreate,
    onNavigateToRequests,
    onSearchCurrentLocation,
  }: ExchangeMapOverlayProps) => {
    return (
      <>
        {/* FAB 버튼 그룹 (프로필 모달 열림 시 숨김) */}
        {!isProfileModalVisible && (
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={[styles.fabButton, styles.locationButton]}
              onPress={onMoveToLocation}
            >
              <Text style={styles.fabText}>📍</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fabButton}
              onPress={onOpenProfile}
            >
              <Text style={styles.fabText}>👤</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 상단 오버레이 버튼 (등록하기 + 교환현황) */}
        <View style={[styles.topOverlayContainer, { top: topInset + theme.spacing.sm }]}>
          <TouchableOpacity
            style={styles.topOverlayButton}
            onPress={onNavigateToCreate}
          >
            <Text style={styles.topOverlayButtonText}>+ 등록하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topOverlayButton}
            onPress={onNavigateToRequests}
          >
            <Text style={styles.topOverlayButtonText}>💬 교환현황</Text>
          </TouchableOpacity>
        </View>

        {/* 재검색 버튼 (지도 이동 시 표시) */}
        {isMapMoved && (
          <TouchableOpacity
            style={[
              styles.reSearchButton,
              { top: topInset + OVERLAY_LAYOUT.reSearchOffset },
            ]}
            onPress={onSearchCurrentLocation}
          >
            <Text style={styles.reSearchText}>↻ 현 지도에서 재검색</Text>
          </TouchableOpacity>
        )}
      </>
    );
  },
);

ExchangeMapOverlay.displayName = "ExchangeMapOverlay";

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    elevation: 5,
  },
  fabButton: {
    position: "absolute",
    bottom: theme.spacing.xxl,
    right: theme.spacing.xxl,
    width: OVERLAY_LAYOUT.fabSize,
    height: OVERLAY_LAYOUT.fabSize,
    borderRadius: OVERLAY_LAYOUT.fabSize / 2,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  locationButton: {
    backgroundColor: theme.colors.info,
    bottom: theme.spacing.xxl + OVERLAY_LAYOUT.fabSpacing,
  },
  fabText: {
    fontSize: OVERLAY_LAYOUT.fabIconSize,
    color: theme.colors.background,
  },
  topOverlayContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.COMPONENT,
    zIndex: 10,
  },
  topOverlayButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.COMPONENT,
    paddingVertical: theme.spacing.SMALL,
    borderRadius: OVERLAY_LAYOUT.pillRadius,
    flexDirection: "row",
    alignItems: "center",
    ...theme.shadow.card,
  },
  topOverlayButtonText: {
    fontSize: theme.typography.size.BODY,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  reSearchButton: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: OVERLAY_LAYOUT.pillRadius,
    flexDirection: "row",
    alignItems: "center",
    ...theme.shadow.button,
    zIndex: 2000,
  },
  reSearchText: {
    color: theme.colors.background,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    marginLeft: theme.spacing.xs,
  },
});
