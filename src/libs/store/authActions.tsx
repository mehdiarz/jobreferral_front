import { Store } from '@tanstack/react-store'
import type { User } from '../store'

interface AuthState {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    isLoading: boolean
    fullName?: string
    branchName?: string
    permissions: string[]
}

export const authStore = new Store<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    permissions: [],
})

const hasStorage = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined'

export const authActions = {
    login: (
        userName: string,
        token: string,
        roles: string[],
        nationalId: string,
        fullName?: string,
        branchName?: string,
        permissions: string[] = [],
    ) => {
        const user: User = {
            id: nationalId,
            username: userName,
            full_name: fullName || userName,
            roles: roles.join(','),
            fullName,
            branchName,
        }

        authStore.setState((state) => ({
            ...state,
            isAuthenticated: true,
            user,
            token,
            isLoading: false,
            fullName,
            branchName,
            permissions,
        }))

        if (!hasStorage()) return

        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(userName))
        localStorage.setItem('roles', JSON.stringify(roles))
        localStorage.setItem('permissions', JSON.stringify(permissions))
        localStorage.setItem('auth_national_Id', JSON.stringify(nationalId))

        if (fullName) {
            localStorage.setItem('auth_fullName', fullName)
        } else {
            localStorage.removeItem('auth_fullName')
        }

        if (branchName) {
            localStorage.setItem('auth_branchName', branchName)
        } else {
            localStorage.removeItem('auth_branchName')
        }
    },

    setPermissions: (permissions: string[]) => {
        authStore.setState((state) => ({
            ...state,
            permissions,
        }))

        if (!hasStorage()) return
        localStorage.setItem('permissions', JSON.stringify(permissions))
    },

    logout: () => {
        authStore.setState((state) => ({
            ...state,
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            fullName: undefined,
            branchName: undefined,
            permissions: [],
        }))

        if (!hasStorage()) return

        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('roles')
        localStorage.removeItem('permissions')
        localStorage.removeItem('auth_national_Id')
        localStorage.removeItem('auth_fullName')
        localStorage.removeItem('auth_branchName')
    },

    setLoading: (isLoading: boolean) => {
        authStore.setState((state) => ({
            ...state,
            isLoading,
        }))
    },

    initializeFromStorage: () => {
        if (!hasStorage()) return

        const token = localStorage.getItem('auth_token')
        const userStr = localStorage.getItem('auth_user')
        const fullName = localStorage.getItem('auth_fullName') || undefined
        const branchName = localStorage.getItem('auth_branchName') || undefined
        const nationalId = localStorage.getItem('auth_national_Id')
        const rolesStr = localStorage.getItem('roles')
        const permissionsStr = localStorage.getItem('permissions')

        if (!token || !userStr) return

        try {
            const userName = JSON.parse(userStr)
            const roles = rolesStr ? JSON.parse(rolesStr) : []
            const permissions = permissionsStr ? JSON.parse(permissionsStr) : []
            const nationalIdValue = nationalId ? JSON.parse(nationalId) : ''

            const normalizedRoles = Array.isArray(roles) ? roles : []
            const normalizedPermissions = Array.isArray(permissions) ? permissions : []

            const user: User = {
                id: nationalIdValue,
                username: userName,
                full_name: fullName || userName,
                roles: normalizedRoles.join(','),
                fullName,
                branchName,
            }

            authStore.setState((state) => ({
                ...state,
                isAuthenticated: true,
                user,
                token,
                isLoading: false,
                fullName,
                branchName,
                permissions: normalizedPermissions,
            }))
        } catch (error) {
            console.error('Failed to parse stored user data:', error)
            authActions.logout()
        }
    },
}
