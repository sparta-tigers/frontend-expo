import { Button } from "@/components/ui/button";
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
import { useTheme } from "react-native-paper";

// 정적 스타일 정의
const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 8,
  },
  chatRoomItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    position: "absolute",
    top: 16,
    right: 16,
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
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
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
  const theme = useTheme();

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
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outline,
          },
        ]}
        onPress={() => router.push(`/chat/${item.directRoomId}`)}
        activeOpacity={0.7}
      >
        {/* 아바타 */}
        <View
          style={[
            chatStyles.avatar,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text
            style={[
              chatStyles.avatarText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {item.opponentNickname.charAt(0).toUpperCase()}
          </Text>
          {item.opponentOnline && (
            <View
              style={[
                chatStyles.onlineIndicator,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          )}
        </View>

        {/* 채팅 정보 */}
        <View style={chatStyles.chatInfo}>
          <Text
            style={[chatStyles.nickname, { color: theme.colors.onSurface }]}
          >
            {item.opponentNickname}
          </Text>
          <Text
            style={[
              chatStyles.itemTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {item.itemTitle}
          </Text>
        </View>

        {/* 시간 */}
        <Text style={[chatStyles.date, { color: theme.colors.outline }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    ),
    [router, theme],
  );

  // 로딩 상태
  if (chatRoomsState.status === "loading" && chatRoomsState.data.length === 0) {
    return (
      <View
        style={[
          chatStyles.loadingContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[chatStyles.loadingText, { color: theme.colors.onSurface }]}
        >
          채팅방 목록을 불러오는 중...
        </Text>
      </View>
    );
  }

  // 에러 상태
  if (chatRoomsState.status === "error" && chatRoomsState.data.length === 0) {
    return (
      <View
        style={[
          chatStyles.errorContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[chatStyles.errorText, { color: theme.colors.error }]}>
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
  if (!chatRoomsState.data || chatRoomsState.data.length === 0) {
    return (
      <View
        style={[
          chatStyles.emptyContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[chatStyles.emptyText, { color: theme.colors.onSurface }]}>
          채팅방이 없습니다
        </Text>
        <Text
          style={[
            chatStyles.emptySubText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          아이템 교환을 시작해보세요
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[chatStyles.container, { backgroundColor: theme.colors.surface }]}
    >
      <FlatList
        data={chatRoomsState.data || []}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.directRoomId.toString()}
        refreshing={chatRoomsState.status === "loading"}
        onRefresh={() => loadChatRooms(fetchChatRooms())}
        contentContainerStyle={chatStyles.listContainer}
      />
    </View>
  );
}
