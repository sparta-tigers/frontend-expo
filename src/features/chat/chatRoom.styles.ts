// app/exchange/chat/[roomId]/roomId.styles.ts
import { StyleSheet } from "react-native";
import { theme } from "@/src/styles/theme";
import { BORDER_RADIUS, FONT_SIZE, SPACING } from "@/src/styles/unified-design";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.SCREEN,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    color: theme.colors.text.primary,
  },
  itemHeader: {
    padding: SPACING.COMPONENT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.medium,
    backgroundColor: theme.colors.surface,
  },
  itemTitle: {
    fontSize: FONT_SIZE.BODY,
    fontWeight: "bold",
    marginBottom: SPACING.TINY,
    color: theme.colors.text.primary,
  },
  itemDescription: {
    fontSize: FONT_SIZE.SMALL,
    marginBottom: SPACING.TINY,
    color: theme.colors.text.tertiary,
  },
  itemStatus: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.SMALL,
    color: theme.colors.primary,
  },
  statusButtons: {
    flexDirection: "row",
    gap: SPACING.SMALL,
  },
  statusButton: {
    flex: 1,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
    backgroundColor: theme.colors.primary,
  },
  statusButtonMuted: {
    flex: 1,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
    backgroundColor: theme.colors.text.tertiary,
  },
  statusButtonError: {
    backgroundColor: theme.colors.error,
    flex: 1,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
  },
  statusButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    textAlign: "center",
    color: theme.colors.background,
  },
  loadingText: {
    fontSize: FONT_SIZE.BODY,
    textAlign: "center",
    color: theme.colors.text.tertiary,
  },
  connectionStatus: {
    paddingVertical: SPACING.TINY,
    alignItems: "center",
  },
  connectionStatusConnected: {
    backgroundColor: theme.colors.success,
  },
  connectionStatusDisconnected: {
    backgroundColor: theme.colors.error,
  },
  connectionStatusText: {
    fontSize: FONT_SIZE.CAPTION,
    fontWeight: "600",
    color: theme.colors.background,
  },
  messageListContent: {
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    borderRadius: BORDER_RADIUS.CARD,
    marginVertical: SPACING.TINY,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
  },
  messageText: {
    fontSize: FONT_SIZE.BODY,
  },
  messageTextMine: {
    color: theme.colors.background,
  },
  messageTextOther: {
    color: theme.colors.text.primary,
  },
  senderName: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    marginBottom: SPACING.TINY,
    color: theme.colors.text.tertiary,
  },
  paginationLoading: {
    paddingVertical: SPACING.SMALL,
    alignItems: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.medium,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.BUTTON,
    paddingHorizontal: SPACING.COMPONENT,
    paddingVertical: SPACING.SMALL,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
    borderColor: theme.colors.border.medium,
  },
  sendButton: {
    marginLeft: theme.spacing.SMALL,
    paddingHorizontal: theme.spacing.COMPONENT,
    paddingVertical: theme.spacing.SMALL,
    borderRadius: BORDER_RADIUS.BUTTON,
    backgroundColor: theme.colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.text.tertiary,
  },
  sendButtonText: {
    fontSize: FONT_SIZE.SMALL,
    fontWeight: "600",
    color: theme.colors.background,
  },
});
