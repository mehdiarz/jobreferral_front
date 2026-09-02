import { ChevronDown, BadgeAlert } from "lucide-react";

interface FormMultiSelectModalProps {
  id: string;
  label: string;
  selectedCount: number;
  displayText?: string;
  onClick: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function FormMultiSelectModal({
  id,
  label,
  selectedCount,
  displayText,
  onClick,
  error,
  required = false,
  disabled = false,
  className = "",
}: FormMultiSelectModalProps) {
  const hasValue = selectedCount > 0;

  return (
    <div className="relative w-full my-1">
      <button
        id={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex w-full items-center justify-between border rounded-md p-3 text-sm transition text-right appearance-none focus:outline-none focus:ring-0 disabled:opacity-30 ${
          error
            ? "border-red-500 focus:border-red-500 text-red-600 dark:text-red-400"
            : "border-gray-300 dark:border-slate-500 text-gray-900 dark:text-white focus:border-blue-900 dark:focus:border-slate-400"
        } ${className}`}
      >
        <span className="flex items-center gap-2 truncate pl-6">
          {hasValue ? (
            <>
              <span className="shrink-0 rounded bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                {selectedCount} مورد
              </span>
              <span className="truncate text-gray-700 dark:text-gray-200 text-xs">
                {displayText}
              </span>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">
              انتخاب کنید
            </span>
          )}
        </span>

        <ChevronDown className="w-5 h-5 text-gray-400 pointer-events-none shrink-0" />
      </button>

      {/* Floating Label هماهنگ با FormSelect و FormInput */}
      <label
        htmlFor={id}
        className={`absolute text-sm right-3 px-2 select-none pointer-events-none top-3.5 -translate-y-6 scale-75 bg-white dark:bg-slate-800 duration-100 ${
          error
            ? "text-red-500 dark:text-red-400"
            : "text-gray-500 dark:text-white"
        }`}
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>

      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center">
          <BadgeAlert className="w-3 h-3 ml-1" />
          {error}
        </p>
      )}
    </div>
  );
}
