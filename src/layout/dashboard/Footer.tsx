// src/layout/dashboard/Footer.tsx
import FormToast from "../../baseComponents/Toast";
import { useToastStore } from "../../libs/store";
import { toastActions } from "../../libs/store/toastActions";
import packageJson from '../../../package.json';

export default function Footer() {
    const { toast } = useToastStore();

    return (
        <>
            <footer className="text-xs text-gray-500 px-4 py-2 flex justify-between bg-white rounded-lg mb-2 ml-2 dark:bg-slate-800 dark:text-white">
                <span>نسخه {packageJson.version}</span>
                <span>چهار شنبه 24/04/1405</span>

                {toast && (
                    <div className="fixed left-5 bottom-5 max-w-sm w-full z-50" dir="rtl">
                        <FormToast
                            id={1}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration || 5000}
                            onClose={() => toastActions.hideToast()}
                        />
                    </div>
                )}
            </footer>
        </>
    );
}
