// src/libs/store/appActions.tsx
import { Store } from '@tanstack/store'

interface AppState {
    sidebarOpen: boolean
    theme: 'light' | 'dark'
    language: 'fa' | 'en'
}

export const appStore = new Store<AppState>({
    sidebarOpen: true,
    theme: 'light',
    language: 'fa',
})

// App Store Actions
export const appActions = {
    toggleSidebar: () => {
        appStore.setState((state) => ({
            ...state,
            sidebarOpen: !state.sidebarOpen,
        }))
    },

    setSidebarOpen: (open: boolean) => {
        appStore.setState((state) => ({
            ...state,
            sidebarOpen: open,
        }))
    },

    setTheme: (theme: 'light' | 'dark') => {
        appStore.setState((state) => ({
            ...state,
            theme,
        }))
    },

    setLanguage: (language: 'fa' | 'en') => {
        appStore.setState((state) => ({
            ...state,
            language,
        }))
    },
}
