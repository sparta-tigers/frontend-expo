import { Button } from "@/components/ui/button";
import { SafeLayout } from "@/components/ui/safe-layout";
import { BORDER_RADIUS, FONT_SIZE, SHADOW, SPACING } from "@/constants/layout";
import { useTheme } from "@/hooks/useTheme";
import { chatroomsGetListAPI } from "@/src/api/chatrooms";
import { ApiResponse, ResultType } from "@/src/api/index";
import { DirectRoomResponse } from "@/src/api/types/chatrooms";
import { useAsyncState } from "@/src/hooks/useAsyncState";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 정적 스타일 정의
const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.COMPONENT,
    paddingHorizontal: SPACING.SCREEN,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  listContainer: {
    padding: SPACING.SMALL,
  },
  chatRoomItem: {
    flexDirection: "row",
    padding: SPACING.COMPONENT,
    borderBottomWidth: 1,
    borderRadius: BORDER_RADIUS.CARD,
    marginVertical: SPACING.TINY,
    marginHorizontal: SPACING.SMALL,
    ...SHADOW.CARD,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.COMPONENT,
  },
  avatarText: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
    marginBottom: SPACING.TINY,
  },
  itemTitle: {
    fontSize: FONT_SIZE.SMALL,
  },
  date: {
    fontSize: FONT_SIZE.CAPTION,
    position: "absolute",
    top: SPACING.COMPONENT,
    right: SPACING.COMPONENT,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    marginBottom: SPACING.SMALL,
  },
  emptySubText: {
    fontSize: FONT_SIZE.SMALL,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: SPACING.SMALL,
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: FONT_SIZE.BODY,
    marginBottom: SPACING.COMPONENT,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 120,
  },
});

/**
 * 채팅방 목록 화면
 * 사용자가 속한 모든 1:1 채팅방 목록을 보여주는 탭 페이지
 */
export default function ChatListScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // useAsyncState 훅으로 상태 관리 통일
  const [chatRoomsState, loadChatRooms] = useAsyncState<DirectRoomResponse[]>(
    [],
  );

  // 채팅방 목록 로드 함수
  const fetchChatRooms = useCallback(async () => {
    const response: ApiResponse<any> = await chatroomsGetListAPI(0, 20);

    if (response.resultType === ResultType.SUCCESS && response.data) {
      return response.data.content || [];
    } else {
      throw new Error(
        response.error?.message || "채팅방 목록을 불러오는데 실패했습니다.",
      );
    }
  }, []);

  // 탭이 포커스될 때마다 목록 갱신
  useFocusEffect(
    useCallback(() => {
      loadChatRooms(fetchChatRooms());
    }, [loadChatRooms, fetchChatRooms]),
  );

  // 채팅방 렌더 함수
  const renderChatRoom = useCallback(
    ({ item }: { item: DirectRoomResponse }) => (
      <TouchableOpacity
        style={[
          chatStyles.chatRoomItem,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => router.push(`/chat/${item.directRoomId}`)}
        activeOpacity={0.7}
      >
        {/* 아바타 */}
        <View style={[chatStyles.avatar, { backgroundColor: colors.card }]}>
          <Text style={[chatStyles.avatarText, { color: colors.muted }]}>
            {item.opponentNickname.charAt(0).toUpperCase()}
          </Text>
          {item.opponentOnline && (
            <View
              style={[
                chatStyles.onlineIndicator,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </View>

        {/* 채팅 정보 */}
        <View style={chatStyles.chatInfo}>
          <Text style={[chatStyles.nickname, { color: colors.text }]}>
            {item.opponentNickname}
          </Text>
          <Text style={[chatStyles.itemTitle, { color: colors.muted }]}>
            {item.itemTitle}
          </Text>
        </View>

        {/* 시간 */}
        <Text style={[chatStyles.date, { color: colors.muted }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    ),
    [router, colors],
  );

  // 로딩 상태
  if (
    chatRoomsState.status === "loading" &&
    (!chatRoomsState.data?.length || chatRoomsState.data?.length === 0)
  ) {
    return (
      <View
        style={[
          chatStyles.loadingContainer,
          { backgroundColor: colors.surface },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[chatStyles.loadingText, { color: colors.text }]}>
          채팅방 목록을 불러오는 중...
        </Text>
      </View>
    );
  }

  // 에러 상태
  if (
    chatRoomsState.status === "error" &&
    (!chatRoomsState.data?.length || chatRoomsState.data?.length === 0)
  ) {
    return (
      <View
        style={[chatStyles.errorContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[chatStyles.errorText, { color: colors.destructive }]}>
          {chatRoomsState.error}
        </Text>
        <Button
          onPress={() => loadChatRooms(fetchChatRooms())}
          style={chatStyles.retryButton}
        >
          다시 시도
        </Button>
      </View>
    );
  }

  // 빈 상태
  if (!chatRoomsState.data?.length || chatRoomsState.data.length === 0) {
    return (
      <View
        style={[chatStyles.emptyContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[chatStyles.emptyText, { color: colors.text }]}>
          채팅방이 없습니다
        </Text>
        <Text style={[chatStyles.emptySubText, { color: colors.muted }]}>
          아이템 교환을 시작해보세요
        </Text>
      </View>
    );
  }

  return (
    <SafeLayout
      style={{ backgroundColor: colors.surface }}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={chatRoomsState.data || []}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.directRoomId.toString()}
        refreshing={chatRoomsState.status === "loading"}
        onRefresh={() => loadChatRooms(fetchChatRooms())}
        contentContainerStyle={chatStyles.listContainer}
      />
    </SafeLayout>
  );
}
