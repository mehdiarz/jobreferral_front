import { AlertTriangle, LogOut } from 'lucide-react'
import { useAuthStore } from '../libs/store'

interface ErrorPageProps {
    error?: Error | Response
}

export const ErrorPage = ({ error }: ErrorPageProps) => {
    const { isAuthenticated } = useAuthStore()

    // Debug: log the error to see what we're getting
    if (error) {
        console.error('ErrorPage error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : null,
            raw: error
        });
    }    console.log('Is authenticated:', isAuthenticated)

    // Check if this is a session expiry error
    const isSessionExpired = !isAuthenticated ||
        (error instanceof Response && error.status === 307 && error.url?.includes('/login')) ||
        (error instanceof Error && (
            error.message?.includes('رمز شما منقضی شده است') ||
            error.message?.includes('لطفاً دوباره وارد شوید') ||
            error.message?.includes('منقضی') ||
            error.message?.includes('session') ||
            error.message?.includes('401') ||
            error.message?.includes('unauthorized') ||
            error.message?.includes('expire')
        ))

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isSessionExpired ? 'bg-orange-100' : 'bg-red-100'
                    }`}>
                        {isSessionExpired ? (
                            <LogOut className="w-8 h-8 text-orange-600" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {isSessionExpired ? 'رمز شما منقضی شده است' : 'خطا! مشکلی پیش آمده'}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {isSessionExpired
                            ? 'در حال هدایت به صفحه ورود ...'
                            : 'خطای غیرمنتظره‌ای رخ داده است. لطفاً صفحه را رفرش کنید.'
                        }
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-700 font-mono break-all">
                            {error instanceof Error
                                ? error.message || 'خطای نامشخص رخ داده است'
                                : error instanceof Response
                                    ? `HTTP ${error.status}: ${error.statusText || 'خطای سرور'}`
                                    : 'خطای نامشخص رخ داده است'
                            }
                        </p>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        در صورت ادامه این مشکل، لطفاً با تیم پشتیبانی تماس بگیرید.
                    </p>
                </div>
            </div>
        </div>
    )
}