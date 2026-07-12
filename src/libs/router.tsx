import {
    createRouter,
    createRoute,
    createRootRoute,
    redirect,
    Outlet,
} from '@tanstack/react-router'
import { lazy, type ReactNode, useEffect } from 'react'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ErrorPage } from '../baseComponents/ErrorPage'
import { SuspenseLoading } from '../baseComponents/SuspenseLoading'
import { useAuthStore } from './store'
import { authActions, authStore } from './store/authActions'

// کامپوننت موقت برای صفحاتی که هنوز ساخته نشده‌اند
const PagePlaceholder = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-500 text-center">این صفحه در حال آماده‌سازی است و به زودی پیاده‌سازی خواهد شد.</p>
    </div>
)

const rootRoute = createRootRoute({
    component: () => (
        <>
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
    errorComponent: ({ error }) => <ErrorPage error={error} />,
})

const AuthGuard = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuthStore()
    const token = localStorage.getItem('auth_token')
    const hasToken = !!token

    // useEffect(() => {
    //     if (hasToken && !isAuthenticated) {
    //         authActions.initializeFromStorage()
    //     }
    // }, [hasToken, isAuthenticated])
    //
    //
    // if (!hasToken && !isAuthenticated) {
    //     throw redirect({ to: '/login' })
    // }

    return <>{children}</>
}

const DashboardLayoutWrapper = () => {
    const DashboardLayout = lazy(() => import('../layout/dashboard/DashboardLayout'))

    return (
        <AuthGuard>
            <SuspenseLoading message="در حال بارگذاری قالب داشبورد...">
                <DashboardLayout />
            </SuspenseLoading>
        </AuthGuard>
    )
}

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
        const { isAuthenticated } = authStore.state
        throw redirect({ to: isAuthenticated ? '/dashboard' : '/login' })
    },
    component: () => <div>در حال انتقال...</div>,
})

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <PagePlaceholder title="صفحه ورود (LoginPage)" />,
})

const dashboardLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: DashboardLayoutWrapper,
})

const dashboardIndexRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/',
    component: () => <PagePlaceholder title="میز کار (داشبورد)" />,
})

const expertsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/base-info/experts',
    component: () => <PagePlaceholder title="ثبت کارشناسان دادگستری" />,
})

const regionsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/base-info/regions',
    component: () => <PagePlaceholder title="ثبت مناطق استانی" />,
})

const collateralTypesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/base-info/collateral-types',
    component: () => <PagePlaceholder title="ثبت انواع وثایق" />,
})

const attachmentTypesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: '/base-info/attachment-types',
    component: () => <PagePlaceholder title="ثبت انواع ضمائم" />,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    loginRoute,
    dashboardLayoutRoute.addChildren([
        dashboardIndexRoute,
        expertsRoute,

        regionsRoute,
        collateralTypesRoute,
        attachmentTypesRoute,
    ]),
])

export function createAppRouter(basepath: string = '/') {
    return createRouter({
        routeTree,
        defaultPreload: 'intent',
        basepath: basepath === '/' ? '/' : basepath,
    })
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof createAppRouter>
    }
}
