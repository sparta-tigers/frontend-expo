import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SceneMap, TabView } from "react-native-tab-view";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { apiClient } from "@/src/core/client";
import { Item } from "@/src/features/exchange/types";
import { useAuth } from "@/src/hooks/useAuth";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";
import { Logger } from "@/src/utils/logger";

/**
 * 교환 리스트 컴포넌트
 * TabView 내에서 재사용되는 리스트 컴포넌트
 */
interface ExchangeListProps {
  /** 역할: buyer(신청한 교환) | seller(요청받은 교환) */
  role: "buyer" | "seller";
}

const ExchangeList: React.FC<ExchangeListProps> = ({ role }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: SPACING.COMPONENT,
    },
    loadingText: {
      fontSize: FONT_SIZE.BODY,
      textAlign: "center",
    },
    emptyText: {
      fontSize: FONT_SIZE.BODY,
      textAlign: "center",
    },
    itemContainer: {
      flexDirection: "row",
      padding: SPACING.COMPONENT,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: SPACING.SMALL,
      backgroundColor: colors.surface,
    },
    exchangeItem: {
      padding: SPACING.COMPONENT,
      marginBottom: SPACING.SMALL,
      borderRadius: BORDER_RADIUS.CARD,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: BORDER_RADIUS.IMAGE,
      backgroundColor: colors.surface,
      marginRight: SPACING.SMALL,
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.TINY,
    },
    itemTitle: {
      fontSize: FONT_SIZE.BODY,
      fontWeight: "bold",
      flex: 1,
    },
    itemCategory: {
      fontSize: FONT_SIZE.SMALL,
      marginLeft: SPACING.SMALL,
    },
    itemDescription: {
      fontSize: FONT_SIZE.SMALL,
      color: colors.muted,
      marginBottom: SPACING.SMALL,
    },
    itemFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.SMALL,
    },
    itemUser: {
      fontSize: FONT_SIZE.SMALL,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: SPACING.SMALL,
      paddingVertical: SPACING.TINY,
      borderRadius: BORDER_RADIUS.BUTTON,
    },
    statusText: {
      fontSize: FONT_SIZE.CAPTION,
      fontWeight: "600",
    },
    chatButton: {
      paddingVertical: SPACING.SMALL,
      borderRadius: BORDER_RADIUS.BUTTON,
    },
    chatButtonText: {
      fontSize: FONT_SIZE.SMALL,
      fontWeight: "600",
      textAlign: "center",
    },
    testContainer: {
      padding: SPACING.COMPONENT,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    testButton: {
      paddingVertical: SPACING.SMALL,
      borderRadius: BORDER_RADIUS.BUTTON,
    },
    testButtonText: {
      fontSize: FONT_SIZE.SMALL,
      fontWeight: "600",
      textAlign: "center",
    },
  });

  // 🚨 앙드레 카파시: 독립적 Query Keys
  const {
    data: exchanges,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["myExchanges", role], // 역할별로 완전히 분리된 쿼리 키
    queryFn: async () => {
      // 역할 매핑: buyer(sender), seller(receiver)
      const backendRole = role === "buyer" ? "sender" : "receiver";

      const response = await apiClient.get("/api/exchanges/my", {
        role: backendRole,
        status: undefined, // 모든 상태
      });

      return response.data.content as Item[];
    },
    enabled: !!user?.userId,
  });

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const renderExchangeItem = ({ item: exchange }: { item: Item }) => (
    <TouchableOpacity
      style={styles.exchangeItem}
      onPress={() => router.push(`/exchange/${exchange.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>
          {exchange.title}
        </Text>
        <Text style={[styles.itemCategory, { color: colors.muted }]}>
          {exchange.category === "TICKET" ? "티켓" : "굿즈"}
        </Text>
      </View>

      <Text style={[styles.itemDescription, { color: colors.muted }]}>
        {exchange.description}
      </Text>

      <View style={styles.itemFooter}>
        <Text style={[styles.itemUser, { color: colors.primary }]}>
          {role === "buyer" ? "받는 사람: " : "보낸 사람: "}
          {exchange.user.nickname}
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                exchange.status === "REGISTERED"
                  ? colors.warning
                  : exchange.status === "COMPLETED"
                    ? colors.success
                    : exchange.status === "FAILED"
                      ? colors.destructive
                      : colors.muted,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.background }]}>
            {exchange.status === "REGISTERED"
              ? "교환 대기"
              : exchange.status === "COMPLETED"
                ? "교환 완료"
                : exchange.status === "FAILED"
                  ? "교환 취소"
                  : "알 수 없음"}
          </Text>
        </View>
      </View>

      <Button
        style={[
          styles.chatButton,
          {
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Text style={[styles.chatButtonText, { color: colors.background }]}>
          채팅하기
        </Text>
      </Button>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          {role === "buyer" ? "신청한 교환" : "요청받은 교환"} 목록을 불러오는
          중...
        </Text>
      </View>
    );
  }

  if (!exchanges || exchanges.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          {role === "buyer" ? "신청한 교환" : "요청받은 교환"} 내역이 없습니다
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={exchanges}
        renderItem={renderExchangeItem}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

/**
 * 내 교환 관리 메인 화면
 *
 * 작업 지시서 Phase 2 Target 6 구현
 * - TabView 최적화: 스와이프 가능한 탭 화면
 * - 독립적 Query Keys: 상태별로 쿼리 키 완전 분리
 * - 상태 동기화: 채팅방에서 거래 완료 시 모든 탭 데이터 일관성 유지
 */
export default function MyExchangesScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // TabView 상태 관리
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "requested", title: "내가 등록한 물건" },
    { key: "received", title: "종료된 교환 내역" },
  ]);

  // 🚨 앙드레 카파시: 상태 동기화 테스트 함수
  const handleTestSync = () => {
    Logger.debug("[Test] 상태 동기화 테스트");

    // 채팅방에서 거래가 완료되었을 때 한 번으로 모든 탭의 데이터가 일관되게 갱신되도록 설계
    queryClient.invalidateQueries({ queryKey: ["myExchanges"] });

    // 관련 캐시까지 모두 무효화
    queryClient.invalidateQueries({ queryKey: ["items"] });
    queryClient.invalidateQueries({ queryKey: ["myItems"] });
  };

  // 🚨 앙드레 카파시: SceneMap으로 각 탭 렌더링
  const renderScene = SceneMap({
    requested: () => <ExchangeList role="buyer" />,
    received: () => <ExchangeList role="seller" />,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 🚨 앙드레 카파시: TabView 최적화 */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
      />

      {/* 🚨 앙드레 카파시: 상태 동기화 테스트 버튼 (개발용) */}
      {__DEV__ && (
        <View style={styles.testContainer}>
          <Button
            onPress={handleTestSync}
            style={[
              styles.testButton,
              {
                backgroundColor: colors.secondary,
              },
            ]}
          >
            <Text style={[styles.testButtonText, { color: colors.background }]}>
              상태 동기화 테스트
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}

// 정적 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    paddingVertical: SPACING.SECTION,
  },
  emptyText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    paddingVertical: SPACING.SECTION,
  },
  exchangeItem: {
    margin: SPACING.SMALL,
    padding: SPACING.COMPONENT,
    borderRadius: BORDER_RADIUS.CARD,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SMALL,
  },
  itemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
    flex: 1,
  },
  itemCategory: {
    fontSize: FONT_SIZE.SMALL,
    marginLeft: SPACING.SMALL,
  },
  itemDescription: {
    fontSize: FONT_SIZE.SMALL,
    marginBottom: SPACING.SMALL,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.SMALL,
  },
  itemUser: {
    fontSize: FONT_SIZE.SMALL,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: SPACING.TINY,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  statusText: {
    fontSize: FONT_SIZE.CAPTION,
    fontWeight: "600",
  },
  chatButton: {
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  chatButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    textAlign: "center",
  },
  testContainer: {
    padding: SPACING.COMPONENT,
    borderTopWidth: 1,
  },
  testButton: {
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  testButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    textAlign: "center",
  },
});
