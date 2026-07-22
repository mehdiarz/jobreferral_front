import { useState, useEffect } from "react";
import { Menu, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { authActions } from "../../libs/store/authActions";
import { useAuthStore } from "../../libs/store";
import { appActions } from "../../libs/store/appActions";

export default function Header() {
  const router = useRouter();
  const { fullName } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Close dropdown on outside click - حالا با data attribute کار می‌کنه
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // بررسی می‌کنیم که کلیک روی هیچ کدوم از دراپ‌داون‌ها نبوده باشه
      if (!target.closest("[data-profile-dropdown]")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const daysOfWeek = [
        "یک‌شنبه",
        "دوشنبه",
        "سه‌شنبه",
        "چهارشنبه",
        "پنج‌شنبه",
        "جمعه",
        "شنبه",
      ];
      const dayName = daysOfWeek[now.getDay()];
      const persianDate = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      const time = new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now);

      setCurrentDateTime(`${dayName} ${persianDate} - ${time}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    authActions.logout();
    router.navigate({ to: "/login" });
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between mt-2 mx-2">
        {/* Mobile menu button */}
        <button
          onClick={() => appActions.toggleSidebar()}
          className="lg:hidden bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-xl
            text-sm cursor-pointer flex justify-center items-center px-3 h-11 w-11
            shadow-sm border border-gray-200/60 transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Right side - User Card - data-profile-dropdown اضافه شد */}
        <div className="relative" data-profile-dropdown>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white
              hover:bg-gray-50 shadow-sm border border-gray-200/60
              transition-all duration-200 group h-11"
          >
            {/* User Icon Avatar */}
            <div
              className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50
              flex items-center justify-center group-hover:bg-blue-200
              dark:group-hover:bg-blue-900/70 transition-colors"
            >
              <User className="w-4 h-4 text-blue-700 dark:text-blue-300" />
            </div>

            {/* User info */}
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                {fullName || "کاربر سیستم"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                {"کاربر سیستم"}
              </p>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 
              ${isProfileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-gray-800
              shadow-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden z-50
              animate-in slide-in-from-top-2 duration-200"
            >
              {/* User info section */}
              <div
                className="p-4 bg-gradient-to-l from-blue-50 to-indigo-50
                dark:from-blue-950/50 dark:to-indigo-950/50
                border-b border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {/* User Icon in Dropdown */}
                  <div
                    className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50
                    flex items-center justify-center"
                  >
                    <User className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {fullName || "کاربر سیستم"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {"کاربر سیستم"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50
                  transition-colors duration-150"
                >
                  <User className="w-4 h-4" />
                  <span>پروفایل کاربری</span>
                </button>

                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50
                  transition-colors duration-150"
                >
                  <Settings className="w-4 h-4" />
                  <span>تنظیمات</span>
                </button>

                <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // جلوگیری از بسته شدن توسط کلیک خارج
                    setIsProfileOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30
                    transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Left side - Date and Time */}
        <div
          className="hidden sm:flex items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-2 h-11
          shadow-sm border border-gray-200/60 dark:border-gray-700/60"
        >
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {currentDateTime || "در حال بارگذاری..."}
          </span>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="flex lg:hidden items-center mt-2 mx-2 gap-2">
        {/* Mobile menu button */}
        <button
          onClick={() => appActions.toggleSidebar()}
          className="bg-white hover:bg-gray-50 text-gray-700 rounded-xl
            cursor-pointer flex justify-center items-center h-11 w-11 flex-shrink-0
            shadow-sm border border-gray-200/60 dark:border-gray-700/60
            transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* User Card - وسط در موبایل - data-profile-dropdown اضافه شد */}
        <div className="relative flex-1" data-profile-dropdown>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white
              hover:bg-gray-50 shadow-sm border border-gray-200/60 dark:border-gray-700/60
              transition-all duration-200 group h-11 w-full"
          >
            {/* User Icon Avatar */}
            <div
              className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50
              flex items-center justify-center group-hover:bg-blue-200
              dark:group-hover:bg-blue-900/70 transition-colors flex-shrink-0"
            >
              <User className="w-4 h-4 text-blue-700 dark:text-blue-300" />
            </div>

            {/* User info */}
            <div className="text-right flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight truncate">
                {fullName || "کاربر سیستم"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                {"کاربر سیستم"}
              </p>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0
              ${isProfileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-gray-800
              shadow-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden z-50
              animate-in slide-in-from-top-2 duration-200"
            >
              {/* User info section */}
              <div
                className="p-4 bg-gradient-to-l from-blue-50 to-indigo-50
                dark:from-blue-950/50 dark:to-indigo-950/50
                border-b border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50
                    flex items-center justify-center"
                  >
                    <User className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {fullName || "کاربر سیستم"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {"کاربر سیستم"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50
                  transition-colors duration-150"
                >
                  <User className="w-4 h-4" />
                  <span>پروفایل کاربری</span>
                </button>

                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50
                  transition-colors duration-150"
                >
                  <Settings className="w-4 h-4" />
                  <span>تنظیمات</span>
                </button>

                <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // جلوگیری از بسته شدن توسط کلیک خارج
                    setIsProfileOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30
                    transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // فقط اگه روی بک‌گراند کلیک شد بسته بشه
            if (e.target === e.currentTarget) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4
            border border-gray-200/60 dark:border-gray-700/60 animate-in zoom-in-95 duration-200"
          >
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/30
                flex items-center justify-center"
              >
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                خروج از حساب کاربری
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                آیا از خروج خود اطمینان دارید؟
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
                  text-gray-600 dark:text-gray-300 font-medium text-sm
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600
                  hover:from-red-600 hover:to-red-700 text-white font-medium text-sm
                  shadow-lg shadow-red-500/20 transition-all duration-200"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
