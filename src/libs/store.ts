// src/libs/store.ts
import { useStore } from '@tanstack/react-store'
import { toastStore } from './store/toastActions'
import { appStore } from './store/appActions'
import { menuStore } from './store/menuActions'
import { authStore } from './store/authActions'

export interface User {
    id: string
    username: string
    full_name: string
    roles: string
    fullName?: string
    branchName?: string
}

export interface MenuItem {
    id: string
    title: string
    icon?: string
    path?: string
    permissions?: string[]
    children?: MenuItem[]
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
    message: string
    type: ToastType
    duration?: number
    detail?: string
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export const useAuthStore = () => useStore(authStore)
export const useMenuStore = () => useStore(menuStore)
export const useAppStore = () => useStore(appStore)
export const useToastStore = () => useStore(toastStore)
