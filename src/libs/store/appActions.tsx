import { Store } from '@tanstack/react-store'

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

    openSidebar: () => {
        appStore.setState((state) => ({
            ...state,
            sidebarOpen: true,
        }))
    },

    closeSidebar: () => {
        appStore.setState((state) => ({
            ...state,
            sidebarOpen: false,
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
