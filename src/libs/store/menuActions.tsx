// src/libs/store/menuActions.tsx
import { Store } from '@tanstack/store'
import type { MenuItem } from '../store'

interface MenuState {
    items: MenuItem[]
    isLoading: boolean
    error: string | null
}

export const menuStore = new Store<MenuState>({
    items: [],
    isLoading: false,
    error: null,
})

// Menu Store Actions
export const menuActions = {
    setItems: (items: MenuItem[]) => {
        menuStore.setState((state) => ({
            ...state,
            items,
            isLoading: false,
            error: null,
        }))
    },

    setLoading: (isLoading: boolean) => {
        menuStore.setState((state) => ({
            ...state,
            isLoading,
        }))
    },

    setError: (error: string) => {
        menuStore.setState((state) => ({
            ...state,
            error,
            isLoading: false,
        }))
    },

    clearError: () => {
        menuStore.setState((state) => ({
            ...state,
            error: null,
        }))
    },
}
