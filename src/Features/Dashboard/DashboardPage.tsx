import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  FileSearch,
  Landmark,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "../../libs/store";
import { getStoredPermissions, hasAnyPermission } from "../../libs/permissions";
import { getStoredRoles } from "../../libs/roles";
import { Permissions } from "../../_shared/init.config";

type QuickAction = {
  title: string;
  description: string;
  path: string;
  permission?: string;
  icon: LucideIcon;
  color: string;
};

const quickActions: QuickAction[] = [
  {
    title: "مدیریت کاربران",
    description: "ایجاد و مدیریت کاربران و نقش‌ها",
    path: "/dashboard/users/create-page",
    permission: Permissions.Pages_Users,
    icon: Users,
    color: "blue",
  },
  {
    title: "درخواست‌های شعبه",
    description: "مشاهده و پیگیری درخواست‌های شعبه",
    path: "/dashboard/requests/branch/view",
    permission: Permissions.Pages_Branch_RequestsView,
    icon: Building2,
    color: "cyan",
  },
  {
    title: "درخواست‌های شعب مستقل",
    description: "پیگیری پرونده‌های شعب مستقل",
    path: "/dashboard/requests/independent/view",
    permission: Permissions.Pages_IndependentBranch_RequestsIndependentView,
    icon: Landmark,
    color: "violet",
  },
  {
    title: "درخواست‌های منطقه",
    description: "بررسی پرونده‌های منطقه‌ای",
    path: "/dashboard/requests/region/view",
    permission: Permissions.Pages_Region_RequestsRegionView,
    icon: MapPinned,
    color: "emerald",
  },
  {
    title: "درخواست‌های ستاد",
    description: "پیگیری ارجاعات و پرونده‌های ستادی",
    path: "/dashboard/requests/main-office/view",
    permission: Permissions.Pages_MainOffice_RequestsMainOfficeView,
    icon: ClipboardList,
    color: "amber",
  },
  {
    title: "اطلاعات پایه",
    description: "مدیریت کارشناسان و اطلاعات سامانه",
    path: "/dashboard/base-info/experts",
    permission: Permissions.Pages_BaseInfo_Experts,
    icon: Database,
    color: "rose",
  },
];

const roleLabel = (permissions: string[] = [], roles: string[] = []) => {
  if (roles.includes("ADMIN") || roles.includes("admin")) {
    return { title: "مدیر سامانه", targetText: "سامانه" };
  }
  if (
    permissions.includes(Permissions.Pages_MainOffice_RequestsMainOfficeView)
  ) {
    return { title: "کاربر ستاد", targetText: "ستاد" };
  }
  if (
    permissions.includes(
      Permissions.Pages_IndependentBranch_RequestsIndependentView,
    )
  ) {
    return { title: "کاربر شعبه مستقل", targetText: "شعبه مستقل" };
  }
  if (permissions.includes(Permissions.Pages_Region_RequestsRegionView)) {
    return { title: "کاربر منطقه", targetText: "منطقه" };
  }
  if (permissions.includes(Permissions.Pages_Branch_RequestsView)) {
    return { title: "کاربر شعبه", targetText: "شعبه" };
  }
  return { title: "کاربر سامانه", targetText: "سامانه" };
};

const persianNumber = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

const colorClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, fullName, permissions } = useAuthStore();
  const userPermissions = permissions.length
    ? permissions
    : getStoredPermissions();
  const roles = getStoredRoles();
  const name = user?.fullName || user?.full_name || fullName || "کاربر";
  const visibleActions = useMemo(
    () =>
      quickActions.filter(
        (item) =>
          !item.permission ||
          hasAnyPermission(userPermissions, [item.permission]),
      ),
    [userPermissions],
  );

  const userAccess = roleLabel(userPermissions, roles);
  const currentRole = userAccess.title;
  const unit = user?.branchName || user?.bid;

  const stats = [
    {
      title: "مجوزهای فعال",
      value: persianNumber(userPermissions.length),
      caption: "سطح دسترسی حساب شما",
      icon: ShieldCheck,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "بخش‌های در دسترس",
      value: persianNumber(visibleActions.length),
      caption: "قابل مشاهده برای شما",
      icon: BarChart3,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "نقش‌های کاربری",
      value: persianNumber(roles.length || 1),
      caption: currentRole,
      icon: Users,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50",
    },
    {
      title: "وضعیت اتصال",
      value: "فعال",
      caption: "سامانه در دسترس است",
      icon: CheckCircle2,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
    },
  ];

  return (
    <div dir="rtl" className="mx-auto w-full max-w-7xl space-y-7 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" /> داشبورد سامانه ارجاع کار به
              کارشناس رسمی دادگستری
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {name} عزیز، خوش آمدید
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
              شما{" "}
              <span className="font-bold text-blue-700 dark:text-blue-300">
                {currentRole}
              </span>{" "}
              هستید و به درخواست‌های{" "}
              <span className="font-bold text-slate-700 dark:text-slate-100">
                {userAccess.targetText} {unit ? `(${unit})` : ""}
              </span>{" "}
              دسترسی دارید.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-700/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">سطح دسترسی</p>
              <p className="mt-1 font-bold text-slate-800 dark:text-white">
                {currentRole}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.title}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              {stat.caption}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                دسترسی‌های سریع
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                بخش‌های مجاز شما از منوی سمت راست نیز در دسترس هستند.
              </p>
            </div>
            <FileSearch className="h-5 w-5 text-blue-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleActions.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate({ to: item.path })}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClasses[item.color]} transition group-hover:scale-105`}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                    {item.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-400">
                    {item.description}
                  </span>
                </span>
                <ArrowLeft className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                راهنمای دسترسی
              </h2>
              <p className="mt-1 text-xs text-slate-400">مسیرهای مهم سامانه</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/40">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                دسترسی به بخش‌ها
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">
                برای مشاهده هر بخش، از میانبرهای بالا یا منوی سمت راست استفاده
                کنید.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/40">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                محدوده فعالیت شما
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">
                شما به‌عنوان {currentRole}
                {unit ? ` در ${unit}` : ""} فقط اطلاعات و درخواست‌های مجاز خود
                را مشاهده می‌کنید.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-xs leading-6 text-blue-700 dark:text-blue-300">
                مجوزهای شما توسط مدیر سامانه تعیین می‌شوند. برای تغییر سطح
                دسترسی با مدیر سامانه تماس بگیرید.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
