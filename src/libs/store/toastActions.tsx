// src/libs/store/toastActions.tsx
import { Store } from '@tanstack/react-store'
import type { Toast } from '../store'

interface ToastState {
    toast: Toast | null
}

export const toastStore = new Store<ToastState>({
    toast: null,
})

export const toastActions = {
    showToast: (toast: Toast) => {
        toastStore.setState(() => ({ toast }))
    },

    hideToast: () => {
        toastStore.setState(() => ({ toast: null }))
    },
}
