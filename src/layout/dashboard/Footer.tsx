import { useState, useEffect } from "react";
import FormToast from "../../baseComponents/Toast";
import { useToastStore } from "../../libs/store";
import { toastActions } from "../../libs/store/toastActions";
import packageJson from "../../../package.json";

export default function Footer() {
  const { toast } = useToastStore();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();

      // نام روزهای هفته به فارسی
      const daysOfWeek = [
        "یک‌شنبه",
        "دوشنبه",
        "سه‌شنبه",
        "چهارشنبه",
        "پنج‌شنبه",
        "جمعه",
        "شنبه",
      ];

      // گرفتن روز هفته
      const dayName = daysOfWeek[now.getDay()];

      // فرمت کردن تاریخ شمسی (با استفاده از toLocaleDateString)
      const persianDate = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);

      // ترکیب روز و تاریخ
      setCurrentDate(`${dayName} ${persianDate}`);
    };

    // اجرای اولیه
    updateDate();

    // آپدیت هر دقیقه (اختیاری)
    const interval = setInterval(updateDate, 60000);

    // پاکسازی interval
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <footer className="text-xs text-gray-500 px-4 py-2 flex justify-between bg-white rounded-lg mb-2 ml-2 dark:bg-slate-800 dark:text-white">
        <span>نسخه {packageJson.version}</span>
        <span>{currentDate || "در حال بارگذاری..."}</span>

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
