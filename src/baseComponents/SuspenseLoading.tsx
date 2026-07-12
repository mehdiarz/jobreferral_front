import { Suspense } from "react";
import { Loader2 } from "lucide-react";

interface SuspenseLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
}

export function SuspenseLoading({
  children,
  fallback,
  message,
}: SuspenseLoadingProps) {
  const defaultFallback = (
    <div className="w-full min-h-[200px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-500 dark:text-blue-400 animate-spin" />
        {message && (
          <span className="text-sm text-gray-600 dark:text-slate-400">{message}</span>
        )}
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      {children}
    </Suspense>
  );
}