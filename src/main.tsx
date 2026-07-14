import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { createAppRouter } from './libs/router'
import { QueryProvider } from './libs/queryClient'
import { loadConfig, getBasePath } from './libs/appConfig'
import { ToastProvider } from './libs/toastContext'


async function bootstrap() {
    await loadConfig()
    const router = createAppRouter(getBasePath())

    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <QueryProvider>
                <ToastProvider>
                <RouterProvider router={router} />
                </ToastProvider>
            </QueryProvider>
        </StrictMode>
    )
}

bootstrap()
