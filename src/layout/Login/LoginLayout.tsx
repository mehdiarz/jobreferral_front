import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      id="root"
      className="max-w-[1280px] mx-auto flex flex-col items-center justify-center text-center min-h-screen"
      style={{ fontFamily: "Vazirmatn, sans-serif" }}
    >
      <div
        className="bg-[url('/images/Login_Color.svg')] bg-cover bg-center bg-no-repeat rounded-2xl p-5"
        dir="rtl"
      >
        <div className="flex flex-col md:flex-row">
          {/* سمت راست (جای فرم ورود یا هر فرم دیگه) */}
          <div className="min-w-100 flex-[0.5] p-6 md:p-10 flex flex-col justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
