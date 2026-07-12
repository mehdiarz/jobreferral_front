import { useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface ToastProps {
    id: number
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
    detail?: string
    onClose: (id: number) => void
}

const Toast = ({ id, message, type, duration = 5000, detail, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(false)
    const onCloseRef = useRef(onClose)

    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        const enterTimer = requestAnimationFrame(() => setIsVisible(true))
        const exitTimer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => onCloseRef.current(id), 300)
        }, duration)

        return () => {
            cancelAnimationFrame(enterTimer)
            clearTimeout(exitTimer)
        }
    }, [duration, id])

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-teal-100/70 text-teal-700 border border-teal-300'
            case 'error':
                return 'bg-red-100/70 text-red-700 border border-red-300'
            case 'warning':
                return 'bg-yellow-100/70 text-yellow-700 border border-yellow-300'
            case 'info':
                return 'bg-blue-100/70 text-blue-700 border border-blue-300'
            default:
                return 'bg-gray-100/70 text-gray-700 border border-gray-300'
        }
    }

    const getIcon = () => {
        const iconClass = 'h-5 w-5'
        switch (type) {
            case 'success':
                return <CheckCircle className={`${iconClass} text-teal-600`} />
            case 'error':
                return <XCircle className={`${iconClass} text-red-600`} />
            case 'warning':
                return <AlertTriangle className={`${iconClass} text-yellow-600`} />
            case 'info':
                return <Info className={`${iconClass} text-blue-600`} />
            default:
                return <Info className={`${iconClass} text-gray-600`} />
        }
    }

    return (
        <div
            className={`rounded-lg transition-all duration-300 ease-in-out transform my-2 backdrop-blur-md shadow-lg ${
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            } ${getTypeStyles()}`}
        >
            <div className="flex items-center p-4 gap-3">
                {getIcon()}

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{message}</p>
                    {detail && (
                        <p className="text-xs text-gray-500 mt-0.5 opacity-90">{detail}</p>
                    )}
                </div>

                <button
                    onClick={() => {
                        setIsVisible(false)
                        setTimeout(() => onClose(id), 300)
                    }}
                    className="inline-flex text-gray-600 hover:text-gray-400 transition duration-150 cursor-pointer opacity-70"
                    aria-label="close toast"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}

export default Toast
