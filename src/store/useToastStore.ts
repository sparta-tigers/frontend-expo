import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  isVisible: boolean;
  title: string;
  message?: string;
  type: ToastType;
  showToast: (title: string, message?: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  isVisible: false,
  title: '',
  message: undefined,
  type: 'info',
  showToast: (title, message, type = 'info') => set({ isVisible: true, title, message, type }),
  hideToast: () => set({ isVisible: false }),
}));
