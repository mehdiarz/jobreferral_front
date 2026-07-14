// src/libs/store/toastActions.tsx
import { Store } from '@tanstack/store'

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    message: string;
    type: ToastType;
    duration?: number;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface ToastState {
    toast: Toast | null;
}

export const toastStore = new Store<ToastState>({
    toast: null,
});

export const toastActions = {
    showToast: (toast: Toast) => {
        toastStore.setState({ toast });
    },

    hideToast: () => {
        toastStore.setState({ toast: null });
    },
};
