import { create } from 'zustand';

export interface ConfirmButton {
  text: string;
  style?: 'cancel' | 'default' | 'destructive';
  onPress?: () => void;
}

interface ConfirmState {
  isVisible: boolean;
  title: string;
  message?: string;
  buttons: ConfirmButton[];
  showConfirm: (title: string, message?: string, buttons?: ConfirmButton[]) => void;
  hideConfirm: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isVisible: false,
  title: '',
  message: undefined,
  buttons: [],
  showConfirm: (title, message, buttons = [{ text: '확인', style: 'default' }]) =>
    set({ isVisible: true, title, message, buttons }),
  hideConfirm: () => set({ isVisible: false }),
}));
