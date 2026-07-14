// src/libs/store.ts
import { useStore } from '@tanstack/react-store'
import { toastStore } from './store/toastActions'
import { appStore } from './store/appActions'
import { menuStore } from './store/menuActions'
import { authStore } from './store/authActions'

// Types
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
    icon: string
    path?: string
    permissions?: string[]
    children?: MenuItemBase[]
}

export interface MenuItemBase {
    id: string
    title: string
    icon: string
    path: string
    permissions?: string[]
}

// React hooks for using stores
export const useAuthStore = () => useStore(authStore)
export const useMenuStore = () => useStore(menuStore)
export const useAppStore = () => useStore(appStore)
export const useToastStore = () => useStore(toastStore)
