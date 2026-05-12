// app/exchange/chat/[roomId].tsx
// Why: Expo Router 라우트 파일. 실제 로직은 [roomId]/ 하위 모듈에 위임.
import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useChatRoom } from "@/src/features/chat/useChatRoom";
import { styles } from "@/src/features/chat/chatRoom.styles";
import { useAuth } from "@/src/hooks/useAuth";

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();

  const {
    exchangeItem,
    itemLoading,
    flattenedMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isConnected,
    isInputDisabled,
    handleSendMessage,
    handleStatusChange,
    isRoomIdInvalid,
    messageText,
    setMessageText,
  } = useChatRoom(roomId);

  if (isRoomIdInvalid) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>채팅방 연결 오류: ID 없음</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* 아이템 헤더 */}
      <View style={styles.itemHeader}>
        {itemLoading ? (
          <Text style={styles.loadingText}>아이템 정보를 불러오는 중...</Text>
        ) : exchangeItem ? (
          <View>
            <Text style={styles.itemTitle}>{exchangeItem.title}</Text>
            <Text style={styles.itemDescription}>{exchangeItem.description}</Text>
            <Text style={styles.itemStatus}>
              상태:{" "}
              {exchangeItem.status === "REGISTERED"
                ? "등록됨"
                : exchangeItem.status === "COMPLETED"
                  ? "교환 완료"
                  : "교환 취소"}
            </Text>

            {exchangeItem.status === "REGISTERED" && (
              <View style={styles.statusButtons}>
                {exchangeItem.ownerId === user?.userId ? (
                  <>
                    <TouchableOpacity
                      onPress={() => handleStatusChange("COMPLETE")}
                      style={styles.statusButton}
                    >
                      <Text style={styles.statusButtonText}>교환 완료하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleStatusChange("CANCEL")}
                      style={styles.statusButtonError}
                    >
                      <Text style={styles.statusButtonText}>거절하기</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.statusButtonMuted}>
                    <Text style={styles.statusButtonText}>교환 대기 중</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* 연결 상태 */}
      <View
        style={[
          styles.connectionStatus,
          isConnected
            ? styles.connectionStatusConnected
            : styles.connectionStatusDisconnected,
        ]}
      >
        <Text style={styles.connectionStatusText}>
          {isConnected ? "연결됨" : "연결 끊김"}
        </Text>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        inverted={true}
        data={flattenedMessages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messageListContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.isMine ? styles.myBubble : styles.otherBubble,
            ]}
          >
            {!item.isMine && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                item.isMine ? styles.messageTextMine : styles.messageTextOther,
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.paginationLoading}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>이전 메시지 로딩 중...</Text>
            </View>
          ) : null
        }
      />

      {/* 입력창 */}
      <View style={styles.inputBar}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder={
            exchangeItem?.exchangeStatus === "PENDING"
              ? "아직 수락 대기 중인 교환 요청입니다"
              : exchangeItem?.exchangeStatus === "REJECTED"
                ? "거절된 교환 요청입니다"
                : isInputDisabled
                  ? "종료된 교환입니다"
                  : "메시지를 입력하세요"
          }
          placeholderTextColor={styles.loadingText.color}
          editable={!isInputDisabled}
          style={styles.textInput}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={isInputDisabled || !messageText.trim()}
          style={[
            styles.sendButton,
            (isInputDisabled || !messageText.trim()) && styles.sendButtonDisabled,
          ]}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
