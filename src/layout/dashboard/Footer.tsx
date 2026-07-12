import React, { useEffect } from 'react'
import { useToastStore } from '../../libs/store.ts'

const Footer: React.FC = () => {
    const { toast, hideToast } = useToastStore()

    useEffect(() => {
        if (toast?.duration) {
            const timer = setTimeout(() => {
                hideToast()
            }, toast.duration)
            return () => clearTimeout(timer)
        }
    }, [toast, hideToast])

    return (
        <footer className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-[9999]">
            {/* Container for Toasts */}
            <div className="flex flex-col gap-2 items-center w-full max-w-md px-4">
                {toast && (
                    <div
                        className={`
              pointer-events-auto w-full p-4 rounded-lg shadow-2xl border transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4
              ${getToastStyles(toast.type)}
            `}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="font-bold text-sm">{toast.message}</p>
                                {toast.detail && (
                                    <p className="text-xs opacity-90 mt-1 leading-relaxed">
                                        {toast.detail}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={hideToast}
                                className="text-lg leading-none opacity-70 hover:opacity-100"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </footer>
    )
}

// Helper function for styles
const getToastStyles = (type: string) => {
    switch (type) {
        case 'success': return 'bg-green-600 border-green-400 text-white'
        case 'error': return 'bg-red-600 border-red-400 text-white'
        case 'warning': return 'bg-amber-500 border-amber-300 text-white'
        case 'info': return 'bg-blue-600 border-blue-400 text-white'
        default: return 'bg-gray-800 border-gray-600 text-white'
    }
}

export default Footer
