import PageTitle from "../../baseComponents/PageTitle";
import { Info, Users, Database, ClipboardList, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../libs/store";
import { useNavigate } from "@tanstack/react-router";

export default function DashboardPage() {
  const { user, fullName } = useAuthStore();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.full_name || fullName || "کاربر";

  const quickLinks = [
    {
      title: "مدیریت کاربران",
      description: "ایجاد کاربر جدید و مدیریت نقش‌ها",
      icon: Users,
      path: "/dashboard/users/create-page",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "اطلاعات پایه",
      description: "مدیریت اطلاعات پایه و تنظیمات سیستم",
      icon: Database,
      path: "/dashboard/base-info/experts",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "مدیریت درخواست‌ها",
      description: "ایجاد و پیگیری درخواست‌های ارجاع کار",
      icon: ClipboardList,
      path: "/dashboard/requests/branch/create",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageTitle
        title="داشبورد سامانه ارجاع کار به کارشناس دادگستری"
        subtitle={`${displayName} عزیز، خوش آمدید`}
      />

      {/* کارت‌های دسترسی سریع */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {quickLinks.map((link) => (
          <button
            key={link.title}
            onClick={() => navigate({ to: link.path })}
            className="bg-white border border-gray-200 rounded-xl p-5 text-right hover:shadow-md hover:border-blue-200 transition-all duration-200 group cursor-pointer"
          >
            <div
              className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
            >
              <link.icon size={20} />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">
              {link.title}
            </h3>
            <p className="text-xs text-gray-400 leading-5">
              {link.description}
            </p>
            <div className="flex items-center gap-1 mt-3 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>ورود</span>
              <ArrowLeft size={12} />
            </div>
          </button>
        ))}
      </div>

      {/* آمار سریع */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ClipboardList size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">درخواست‌های امروز</p>
            <p className="text-lg font-bold text-gray-800">-</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <Users size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">کاربران فعال</p>
            <p className="text-lg font-bold text-gray-800">-</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Database size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">وضعیت سیستم</p>
            <p className="text-sm font-bold text-green-600">فعال</p>
          </div>
        </div>
      </div>

      {/* بنر راهنما */}
      <div className="mt-8 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
        <Info className="text-blue-600 flex-shrink-0" size={18} />
        <p className="text-xs text-gray-700">
          از طریق کارت‌های بالا می‌توانید به بخش‌های مختلف سامانه دسترسی داشته
          باشید. برای مدیریت درخواست‌ها، کاربران و اطلاعات پایه از منوی سمت راست
          نیز می‌توانید استفاده کنید.
        </p>
      </div>
    </div>
  );
}
