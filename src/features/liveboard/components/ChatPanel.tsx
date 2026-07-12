// src/features/liveboard/components/ChatPanel.tsx
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";
import { theme } from "@/src/styles/theme";
import { MaterialIcons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useCallback } from "react";
import { ChatBubbleMessage, useChatPanel } from "@/src/features/liveboard/hooks/useChatPanel";

function ChatBubble({
  author,
  text,
  time,
  mine,
}: {
  author: string;
  text: string;
  time: string;
  mine: boolean;
}) {
  return (
    <Box
      flexDir="row"
      align="flex-end"
      justify={mine ? "flex-end" : "flex-start"}
      style={styles.bubbleRow}
    >
      {mine ? (
        <Typography style={styles.bubbleTime} weight="regular">
          {time}
        </Typography>
      ) : null}
      <Box style={styles.bubbleColumn} align={mine ? "flex-end" : "flex-start"}>
        <Typography style={styles.bubbleAuthor} weight="regular">
          {author}
        </Typography>
        <Box
          style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
        >
          <Typography
            style={mine ? styles.bubbleTextMine : styles.bubbleTextOther}
            weight="semibold"
          >
            {text}
          </Typography>
        </Box>
      </Box>
      {!mine ? (
        <Typography style={styles.bubbleTime} weight="regular">
          {time}
        </Typography>
      ) : null}
    </Box>
  );
}

/**
 * ChatPanel
 *
 * Why: 라이브보드 1:N STOMP 채팅 UI. 로직은 useChatPanel에 위임.
 */
const LOCAL_LAYOUT = {
  // iOS 키보드 오프셋: LiveSection(aspectRatio 360/274 ~ 약 274px) + TabBar(30px) + StatusBar 보정치 포함 약 320
  keyboardVerticalOffsetIos: 320,
  keyboardVerticalOffsetAndroid: 0,
};

export function ChatPanel({ matchId }: { matchId: string }) {
  const { messages, draft, setDraft, isConnected, scrollRef, handleSend } =
    useChatPanel(matchId);

  const keyExtractor = useCallback((item: ChatBubbleMessage) => item.key, []);
  
  const renderItem = useCallback(({ item }: { item: ChatBubbleMessage }) => {
    const { key, author, text, time, mine } = item;
    return <ChatBubble key={key} author={author} text={text} time={time} mine={mine || false} />;
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={
        Platform.OS === "ios"
          ? LOCAL_LAYOUT.keyboardVerticalOffsetIos
          : LOCAL_LAYOUT.keyboardVerticalOffsetAndroid
      }
    >
      <Box flex={1}>
        <FlatList
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={
            <Box flex={1} align="center" justify="center" py="xxxl">
              <Typography variant="body1" color="text.tertiary" weight="medium">
                {isConnected ? "첫 메시지를 남겨보세요" : "채팅 연결 중..."}
              </Typography>
            </Box>
          }
        />

        <Box style={styles.chatInputWrap}>
          <Box style={styles.chatInput} flexDir="row" align="center">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="메시지 보내기..."
              placeholderTextColor={theme.colors.brand.inactive}
              style={styles.chatInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={isConnected}
            />
          </Box>
          <TouchableOpacity
            style={styles.chatSendBtn}
            onPress={handleSend}
            disabled={!isConnected || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="전송"
          >
            <MaterialIcons
              name="arrow-upward"
              size={16}
              color={theme.colors.background}
            />
          </TouchableOpacity>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  );
}
