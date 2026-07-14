import { X } from 'lucide-react';
import FormButton from "./FormButton.tsx";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Loading from "./Loading.tsx";
import { FluidGrid } from './../baseComponents/FluidGrid.tsx';
import { FluidCol } from './../baseComponents/FluidCol.tsx';

interface AsyncState<T> {
    isLoading: boolean;
    isError: boolean;
    data?: T;
    error?: any;
}

interface ModalProps<T = any> {
    isOpen: boolean
    onClose: () => void
    header?: string
    footerButtons?: React.ReactNode;
    isRTL?: boolean
    asyncState?: AsyncState<T>
    renderContent?: (data: T) => React.ReactNode
    overlayLock: boolean;
    className?: string
}

export default function ModalTemplate<T>({
    isOpen,
    onClose,
    header,
    footerButtons,
    isRTL,
    asyncState,
    renderContent,
    overlayLock = false,
    className = ''
}: ModalProps<T>) {

    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const [visible, setVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            setTimeout(() => {
                gsap.fromTo(
                    overlayRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3 }
                );
                gsap.fromTo(
                    modalRef.current,
                    { scale: 0.8, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: "power3.inOut" }
                );
            }, 0);
        } else {
            // ... (بخش else)
            gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
            gsap.to(modalRef.current, {
                scale: 0.8,
                opacity: 0,
                duration: 0.2,
                ease: "power3.inOut",
                onComplete: () => setVisible(false),
            });
        }
    }, [isOpen]);

    if (!visible) return null

    return (
        <FluidGrid>
            <FluidCol>
                <div ref={overlayRef}
                    onClick={() => {
                        if (!overlayLock) onClose();
                    }}
                    className="fixed z-50 p-4 flex items-center justify-center inset-0 bg-blue-900/10 backdrop-blur-sm">

                    <div ref={modalRef}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-lg max-w-7xl w-full max-h-[90vh] flex flex-col bg-white/80 dark:bg-transparent backdrop-blur-lg shadow-[0_0_40px_rgba(0,0,0,0.3)] dark:shadow-[0_0_40px_rgba(0,0,0,0.7)] ${isRTL ? 'rtl' : 'ltr'}  ${className}`}>

                        {/* Header */}
                        <div
                            className={`flex justify-between items-center py-3 px-6 border-b border-gray-300 dark:border-slate-800 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h2 className={`text-sm dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>{header}</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-600 dark:text-white hover:text-red-700 dark:hover:text-red-500 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/*Content*/}
                        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-800 rounded-b-2xl">
                            {asyncState ? (
                                asyncState.isLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loading message="در حال بارگذاری..." />
                                    </div>
                                ) : asyncState.isError ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loading message="خطا در دریافت اطلاعات" theme="Error" />
                                    </div>
                                ) : (
                                    renderContent && asyncState.data && renderContent(asyncState.data)
                                )
                            ) : (
                                renderContent && renderContent({} as T)
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center px-6 py-4 flex-shrink-0">
                            {footerButtons ? <div className="flex gap-2 justify-end">{footerButtons}</div> : <div></div>}
                            <FormButton
                                onClick={onClose}
                                title='بستن'
                            />
                        </div>
                    </div>
                </div>
            </FluidCol>
        </FluidGrid>
    )
}