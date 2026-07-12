import { DoorOpen, Menu, User } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { authActions } from "../../libs/store/authActions";
import { useAuthStore } from "../../libs/store";
import { appActions } from "../../libs/store/appActions";

export default function Header() {
    const router = useRouter();
    const { fullName } = useAuthStore();

    const handleLogout = () => {
        authActions.logout();
        router.navigate({ to: "/login" });
    };

    return (
        <header className="flex items-center gap-2 mt-2 ml-2">
            {/* دکمه باز کردن سایدبار در موبایل */}
            <button
                onClick={() => appActions.toggleSidebar()}
                className="bg-blue-900 hover:bg-blue-950 dark:bg-slate-800 text-white rounded-lg cursor-pointer flex justify-center items-center h-11 w-11 lg:hidden transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>

            <div className="bg-blue-900 text-white px-4 py-3 rounded-lg mr-1 lg:mr-0 text-sm flex-1 h-11 dark:bg-slate-800 flex items-center shadow-sm">
                <div className="flex flex-row gap-2 items-center">
                    <User className="w-5 h-5 text-teal-400" />
                    <span className="font-medium">{fullName ?? "کاربر مهمان"}</span>
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-red-100 rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2 px-3 h-11 transition-all duration-200 hover:shadow-md"
                title="خروج از حساب کاربری"
            >
                <DoorOpen className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">خروج</span>
            </button>
        </header>
    );
}
