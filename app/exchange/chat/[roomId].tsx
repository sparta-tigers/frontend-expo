// app/exchange/chat/[roomId].tsx
import { styles } from '@/src/features/chat/chatRoom.styles';
import { ChatMessage, useChatRoom } from '@/src/features/chat/useChatRoom';
import { itemsUpdateStatusAPI } from '@/src/features/exchange/api';
import { useAuth } from '@/src/hooks/useAuth';
import { theme } from '@/src/styles/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeKeys } from '@/src/features/exchange/keys';
import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { useToastStore } from '@/src/store/useToastStore';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * ChatRoomScreen (Orchestrator)
 *
 * Why: 채팅 도메인과 환전소 도메인을 연결하는 오케스트레이터 레이어.
 * 비즈니스 액션(API 호출, 캐시 무효화)을 정의하여 하위 훅에 주입함.
 */
export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const roomIdNumber = Number(roomId);

  // 🛠️ 거래 상태 변경 뮤테이션 (상위 레이어로 이동)
  const { mutateAsync: updateStatus } = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: number; status: 'COMPLETE' | 'CANCEL' }) => {
      const response = await itemsUpdateStatusAPI(itemId, status);
      if (response.resultType !== 'SUCCESS') {
        throw new Error(response.error?.message || 'Update failed');
      }
      return response;
    },
    onSuccess: async () => {
      // 🔄 전역 캐시 동기화 (Zero Magic: 도메인 지식이 상위 레이어에 응집됨)
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: ['exchangeItem', roomIdNumber],
          exact: true,
        }),
        queryClient.invalidateQueries({ queryKey: exchangeKeys.items() }),
        queryClient.invalidateQueries({ queryKey: ['myExchanges'] }),
      ];

      invalidations.push(queryClient.invalidateQueries({ queryKey: exchangeKeys.myItems() }));

      // 🛡️ Fail-safe: 개별 무효화 실패가 전체 UI 흐름(성공 알람)을 방해하지 않도록 보장
      await Promise.allSettled(invalidations);
      showToast('거래 상태를 변경했어요.', undefined, 'success');
    },
  });

  // 🔗 콜백 핸들러 정의
  const handleUpdateStatus = useCallback(
    async (status: 'COMPLETE' | 'CANCEL', itemId: number) => {
      await updateStatus({ itemId, status });
    },
    [updateStatus],
  );

  const {
    exchangeItem,
    itemLoading,
    flattenedMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isConnected,
    isInputDisabled,
    isProcessing, // 🛡️ 방어 플래그 수신
    handleSendMessage,
    handleStatusChange,
    isRoomIdInvalid,
    messageText,
    setMessageText,
  } = useChatRoom(roomId, {
    onStatusChange: handleUpdateStatus, // 💉 의존성 주입
  });

  const keyExtractor = useCallback((item: ChatMessage) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View style={[styles.messageBubble, item.isMine ? styles.myBubble : styles.otherBubble]}>
        {!item.isMine ? <Text style={styles.senderName}>{item.senderName}</Text> : null}
        <Text
          style={[
            styles.messageText,
            item.isMine ? styles.messageTextMine : styles.messageTextOther,
          ]}
        >
          {item.content}
        </Text>
      </View>
    ),
    [],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isRoomIdInvalid) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>채팅방을 연결하지 못했어요: ID 없음</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 아이템 헤더 */}
      <View style={styles.itemHeader}>
        {itemLoading ? (
          <ActivityIndicator size="small" color={theme.colors.brand.mint} />
        ) : exchangeItem ? (
          <View>
            <Text style={styles.itemTitle}>{exchangeItem.title}</Text>
            <Text style={styles.itemDescription}>{exchangeItem.description}</Text>
            <Text style={styles.itemStatus}>
              상태:{' '}
              {exchangeItem.status === 'REGISTERED'
                ? '등록됨'
                : exchangeItem.status === 'COMPLETED'
                  ? '교환 완료'
                  : '교환 취소'}
            </Text>

            {exchangeItem.status === 'REGISTERED' ? (
              <View style={styles.statusButtons}>
                {exchangeItem.ownerId === user?.userId ? (
                  <>
                    <TouchableOpacity
                      onPress={() => handleStatusChange('COMPLETE')}
                      style={[styles.statusButton, isProcessing && styles.processingButton]}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.statusButtonText}>교환 완료하기</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleStatusChange('CANCEL')}
                      style={[styles.statusButtonError, isProcessing && styles.processingButton]}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.statusButtonText}>거절하기</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.statusButtonMuted}>
                    <Text style={styles.statusButtonText}>교환 대기 중</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* 연결 상태 */}
      <View
        style={[
          styles.connectionStatus,
          isConnected ? styles.connectionStatusConnected : styles.connectionStatusDisconnected,
        ]}
      >
        <Text style={styles.connectionStatusText}>{isConnected ? '연결됨' : '연결 끊김'}</Text>
      </View>

      <FlatList
        inverted={true}
        data={flattenedMessages}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageListContent}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
      />

      {/* 입력창 */}
      <View style={styles.inputBar}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder={
            exchangeItem?.exchangeStatus === 'PENDING'
              ? '아직 수락 대기 중인 교환 요청이에요'
              : exchangeItem?.exchangeStatus === 'REJECTED'
                ? '거절된 교환 요청이에요'
                : isInputDisabled
                  ? '종료된 교환이에요'
                  : '메시지를 입력하세요'
          }
          placeholderTextColor={theme.colors.text.tertiary}
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
