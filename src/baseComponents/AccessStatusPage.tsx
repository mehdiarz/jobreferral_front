import { useEffect } from "react";
import {
  ArrowRight,
  Home,
  LockKeyhole,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

type AccessStatusPageProps = { status: 403 | 404 };

export default function AccessStatusPage({ status }: AccessStatusPageProps) {
  const navigate = useNavigate();
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });
  const forbidden = status === 403;

  useEffect(() => {
    const timer = window.setTimeout(() => navigate({ to: "/dashboard" }), 8000);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  if (!forbidden) {
    return (
      <div
        dir="rtl"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950"
        style={{ fontFamily: "Vazirmatn, sans-serif" }}
      >
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-900/20" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-900/20" />
        <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-2xl shadow-blue-950/10 dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-[23rem] items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-white">
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_25%,white_25%,white_26%,transparent_26%,transparent_50%,white_50%,white_51%,transparent_51%)] [background-size:3rem_3rem]" />
            <div className="relative text-center">
              <div className="text-[8rem] font-black leading-none tracking-[-0.08em] text-white/95 sm:text-[10rem]">404</div>
              <div className="mx-auto mt-3 h-1.5 w-24 rounded-full bg-cyan-300" />
              <p className="mt-4 text-sm text-blue-100">مسیر موردنظر در سامانه پیدا نشد</p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <SearchX className="h-7 w-7" />
            </div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-blue-600 dark:text-blue-400">خطای مسیر</p>
            <h1 className="mb-3 text-2xl font-bold text-slate-800 dark:text-white">این صفحه وجود ندارد</h1>
            <p className="mb-6 text-sm leading-7 text-slate-500 dark:text-slate-300">
              آدرسی که وارد کرده‌اید اشتباه است، یا صفحه به آدرس دیگری منتقل شده است.
            </p>
            <div className="mb-7 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="mb-1 text-[11px] text-slate-400 dark:text-slate-500">آدرس درخواست‌شده</p>
              <p dir="ltr" className="truncate text-left font-mono text-xs text-slate-600 dark:text-slate-300" title={currentPath}>{currentPath}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700">
                <Home className="h-4 w-4" /> صفحه اصلی
              </button>
              <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <ArrowRight className="h-4 w-4" /> بازگشت
              </button>
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <RefreshCw className="h-3.5 w-3.5" /> انتقال خودکار به صفحه اصلی تا چند ثانیه دیگر
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-blue-50 px-4 dark:bg-slate-900" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      <div className="w-full max-w-lg rounded-3xl border border-gray-200/70 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"><LockKeyhole className="h-10 w-10" /></div>
        <div className="mb-2 text-6xl font-black tracking-tight text-blue-600 dark:text-blue-400">403</div>
        <h1 className="mb-3 text-xl font-bold text-slate-800 dark:text-white">دسترسی غیرمجاز</h1>
        <p className="mx-auto mb-7 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-300">شما مجوز مشاهده این صفحه را ندارید. در صورت نیاز با مدیر سامانه تماس بگیرید.</p>
        <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"><Home className="h-4 w-4" /> بازگشت به صفحه اصلی</button>
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">انتقال خودکار تا چند ثانیه دیگر انجام می‌شود</p>
      </div>
    </div>
  );
}
