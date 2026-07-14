import React from "react";

export type MaxWidthOption =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "full"
  | "screen-sm"
  | "screen-md"
  | "screen-lg"
  | "screen-xl"
  | "screen-2xl";

interface MainLayoutMainProps {
  children: React.ReactNode;
  maxWidth?: MaxWidthOption;
  className?: string;
}

const maxWidthClasses: Record<MaxWidthOption, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
  "screen-sm": "max-w-screen-sm",
  "screen-md": "max-w-screen-md",
  "screen-lg": "max-w-screen-lg",
  "screen-xl": "max-w-screen-xl",
  "screen-2xl": "max-w-screen-2xl",
};

export const MainLayout = {
  Main: ({ children, maxWidth = "7xl", className = "" }: MainLayoutMainProps) => {
    const maxWidthClass = maxWidthClasses[maxWidth];
    return (
      <main
        dir="rtl"
        className={`
          w-full h-full mx-auto px-4 sm:px-6 lg:px-8 
          ${maxWidthClass}
          pt-6 pb-10
          bg-white dark:bg-slate-800
          text-gray-900 dark:text-gray-100
          ${className}
        `}
      >
        {children}
      </main>
    );
  },
};
