// src/features/liveboard/components/ChatPanel.tsx
import { Box } from "@/components/ui/box";
import { Typography } from "@/components/ui/typography";
import { theme } from "@/src/styles/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, TextInput, TouchableOpacity } from "react-native";
import { ChatBubbleMessage, useChatPanel } from "@/src/features/liveboard/hooks/useChatPanel";
import { styles } from "@/src/features/liveboard/styles/matchId.styles";

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
      {mine && (
        <Typography style={styles.bubbleTime} weight="regular">
          {time}
        </Typography>
      )}
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
      {!mine && (
        <Typography style={styles.bubbleTime} weight="regular">
          {time}
        </Typography>
      )}
    </Box>
  );
}

/**
 * ChatPanel
 *
 * Why: 라이브보드 1:N STOMP 채팅 UI. 로직은 useChatPanel에 위임.
 */
export function ChatPanel({ matchId }: { matchId: string }) {
  const { messages, draft, setDraft, isConnected, scrollRef, handleSend } =
    useChatPanel(matchId);

  return (
    <Box flex={1}>
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <Box flex={1} align="center" justify="center" py="xxxl">
            <Typography variant="body1" color="text.tertiary" weight="medium">
              {isConnected ? "첫 메시지를 남겨보세요" : "채팅 연결 중..."}
            </Typography>
          </Box>
        ) : (
          messages.map(({ key, ...rest }: ChatBubbleMessage) => (
            <ChatBubble key={key} {...rest} />
          ))
        )}
      </ScrollView>

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
  );
}
