'use client';

import { create } from 'zustand';
import { type ToastActionElement, type ToastProps } from '@/components/ui/toast';

type ToasterToast = Omit<ToastProps, 'id'> & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastState = {
  toasts: ToasterToast[];
  add: (toast: Omit<ToasterToast, 'id'>) => void;
  dismiss: (toastId: string) => void;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (props) => {
    const id = genId();
    const newToast = { ...props, id };

    set((state) => ({
      toasts: [newToast, ...state.toasts],
    }));
  },
  dismiss: (toastId) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== toastId),
    }));
  },
}));

export const useToast = () => useToastStore();

export const toast = (props: Omit<ToasterToast, 'id'>) => {
  useToastStore.getState().add(props);
};
