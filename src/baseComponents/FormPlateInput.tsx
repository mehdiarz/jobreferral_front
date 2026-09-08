import { BadgeAlert } from "lucide-react";

interface FormPlateInputProps {
  id: string;
  subValue: string; // فرعی
  orgValue: string; // اصلی
  onSubChange: (value: string) => void;
  onOrgChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormPlateInput({
  id,
  subValue,
  orgValue,
  onSubChange,
  onOrgChange,
  label = "پلاک ثبتی (فرعی / اصلی)",
  disabled = false,
  readOnly = false,
  error,
  required = false,
  className = "",
}: FormPlateInputProps) {
  const isFilled = Boolean(subValue || orgValue);

  return (
    <div className="relative w-full my-1">
      {/* کانتینر اصلی ورودی دوگانه با اسلش */}
      <div
        className={`flex items-center border rounded-md transition-colors bg-transparent ${
          error
            ? "border-red-500 focus-within:border-red-500"
            : "border-gray-300 dark:border-slate-500 focus-within:border-blue-900 dark:focus-within:border-slate-400"
        } ${disabled ? "opacity-30 pointer-events-none" : ""} ${className}`}
      >
        {/* اینپوت فرعی (سمت راست) */}
        <input
          id={`${id}-sub`}
          type="text"
          value={subValue}
          onChange={(e) => onSubChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="فرعی"
          dir="ltr"
          className={`w-full flex-1 bg-transparent p-3 text-sm text-center outline-none focus:outline-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
            error
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-white"
          }`}
        />

        {/* اسلش جداکننده وسط */}
        <span className="select-none px-1 text-base font-bold text-gray-400 dark:text-slate-400">
          /
        </span>

        {/* اینپوت اصلی (سمت چپ) */}
        <input
          id={`${id}-org`}
          type="text"
          value={orgValue}
          onChange={(e) => onOrgChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="اصلی"
          dir="ltr"
          className={`w-full flex-1 bg-transparent p-3 text-sm text-center outline-none focus:outline-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
            error
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-white"
          }`}
        />
      </div>

      {/* لیبل شناور منطبق با FormInput */}
      <label
        htmlFor={`${id}-sub`}
        className={`absolute text-sm right-3 px-2 select-none pointer-events-none top-3.5 bg-white dark:bg-slate-800 duration-100 transform ${
          isFilled ? "-translate-y-6 scale-75" : "-translate-y-6 scale-75" // برای وضوح Placeholder های داخلی همیشه در حالت شناور بالا قرار می‌گیرد
        } ${
          error
            ? "text-red-500 dark:text-red-400"
            : "text-gray-500 dark:text-white"
        }`}
      >
        {label}
        {required && (
          <span className="text-red-500 dark:text-red-400 mr-1">*</span>
        )}
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
