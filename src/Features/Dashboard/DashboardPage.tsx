import PageTitle from "../../baseComponents/PageTitle";
import { Info } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <PageTitle
        title="داشبورد سامانه ارجاع کار به کارشناس دادگستری"
        subtitle="به سامانه مدیریت ارجاع کار به کارشناس دادگستری خوش آمدید"
      />

      <div className="mt-12 bg-white border border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Info size={40} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">خوش آمدید</h2>
        <p className="text-gray-500 max-w-md leading-7">
          برای شروع فعالیت، از منوی سمت راست یکی از بخش‌های
          <span className="font-bold text-gray-700"> مدیریت کاربران </span>
          یا
          <span className="font-bold text-gray-700"> اطلاعات پایه </span>
          را انتخاب کنید.
        </p>
      </div>

      {/* بنر راهنما در پایین */}
      <div className="mt-8 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
        <Info className="text-blue-600" size={18} />
        <p className="text-xs text-gray-700">
          دسترسی به کارشناسان، محدوده‌های جغرافیایی، انواع درخواست و مشتریان از
          طریق منوی اطلاعات پایه امکان‌پذیر است.
        </p>
      </div>
    </div>
  );
}
