import {createContext, useContext, useState} from 'react';
import type {ReactNode} from 'react';
import Toast from '../baseComponents/Toast';

interface ToastItem {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    detail?: string;
}

interface ToastContextType {
    showToast: (message: string, type: ToastItem['type'], duration?: number, detail?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0; // شمارنده برای id

export const ToastProvider = ({children}: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = (message: string, type: ToastItem['type'], duration = 5000, detail?: string) => {
        const id = toastId++;
        setToasts(prev => [...prev, { id, message, type, duration, detail }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{showToast}}>
            {children}
            <div className="fixed left-5 bottom-5 max-w-sm w-full z-50" dir="rtl">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        detail={toast.detail}
                        onClose={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};