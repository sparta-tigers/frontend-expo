import React from 'react';
import { StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useConfirmStore } from '@/src/store/useConfirmStore';
import { Box } from './box';
import { Typography } from './typography';
import { theme } from '@/src/styles/theme';

const overlayEntering = FadeIn.duration(200);
const overlayExiting = FadeOut.duration(200);
const modalEntering = ZoomIn.duration(200);
const modalExiting = ZoomOut.duration(200);

export function ConfirmModal() {
  const { isVisible, title, message, buttons, hideConfirm } = useConfirmStore();

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={hideConfirm}>
      <Animated.View entering={overlayEntering} exiting={overlayExiting} style={styles.overlay}>
        <Animated.View
          entering={modalEntering}
          exiting={modalExiting}
          style={styles.modalContainer}
        >
          <Box style={styles.content}>
            <Typography variant="h3" weight="bold" color="text.primary" center>
              {title}
            </Typography>
            {message ? (
              <Typography variant="body1" color="text.secondary" center style={styles.message}>
                {message}
              </Typography>
            ) : null}
          </Box>
          <Box flexDir="row" style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  style={[styles.button, index > 0 && styles.buttonBorderLeft]}
                  onPress={() => {
                    hideConfirm();
                    if (btn.onPress) {
                      setTimeout(btn.onPress, 100);
                    }
                  }}
                >
                  <Typography
                    variant="body1"
                    weight={isCancel ? 'regular' : 'bold'}
                    color={
                      isDestructive ? 'team.kiaRed' : isCancel ? 'text.secondary' : 'brand.mint'
                    }
                  >
                    {btn.text}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </Box>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 9999,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  message: {
    marginTop: 12,
    lineHeight: 22,
  },
  buttonContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border.medium,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBorderLeft: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border.medium,
  },
});
