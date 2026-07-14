import { BadgeAlert } from "lucide-react";
import { formatCurrency, unformatCurrency } from "../utils/persianToISO";
import type { ReactNode } from "react";

interface FormInputProps {
    id: string;
    name: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    label: string;
    disabled?: boolean;
    readOnly?: boolean;
    error?: string;
    placeholder?: string;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number;
    dir?: "ltr" | "rtl";
    className?: string;
    required?: boolean;
    currency?: boolean;
    leftComponent?: ReactNode;
    latinOnly?: boolean;
    autoComplete?: string;
}

export default function FormInput({
                                      id,
                                      name,
                                      type = "text",
                                      value,
                                      onChange,
                                      label,
                                      disabled = false,
                                      readOnly = false,
                                      error,
                                      placeholder = " ",
                                      maxLength,
                                      min,
                                      max,
                                      step,
                                      dir = "ltr",
                                      className = "",
                                      required = false,
                                      currency = false,
                                      leftComponent,
                                      latinOnly = false,
                                      autoComplete,
                                  }: FormInputProps) {
    return (
        <div className="relative w-full my-1">
            <div
                className={`flex items-center border rounded-md ${
                    error ? "border-red-500" : "border-gray-300 dark:border-slate-500"
                }`}
            >
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={currency && type !== "number" ? formatCurrency(value) : value}
                    onChange={(e) => {
                        if (currency && type !== "number") {
                            // For currency input, we want to allow typing numbers and commas
                            const inputValue = e.target.value;
                            // Only allow numbers and commas
                            const cleanValue = inputValue.replace(/[^0-9,]/g, "");
                            // Update the formatted value but pass the unformatted value to onChange
                            onChange(unformatCurrency(cleanValue));
                        } else {
                            // For number inputs with min/max or regular inputs, handle normally
                            const inputValue = e.target.value;
                            if (type === "number" && (min !== undefined || max !== undefined)) {
                                // For number inputs with min/max, ensure the value is within bounds
                                const numValue = parseFloat(inputValue);
                                if (!isNaN(numValue)) {
                                    let clampedValue = numValue;
                                    if (min !== undefined && numValue < min) {
                                        clampedValue = min;
                                    }
                                    if (max !== undefined && numValue > max) {
                                        clampedValue = max;
                                    }
                                    onChange(clampedValue.toString());
                                } else {
                                    onChange(inputValue);
                                }
                            } else {
                                // Filter input to only Latin characters if latinOnly is enabled
                                let filteredValue = inputValue;
                                if (latinOnly) {
                                    // Allow only Latin letters, numbers, and common special characters used in usernames
                                    filteredValue = inputValue.replace(/[^\w\s\-_.@]/g, '');
                                }
                                onChange(filteredValue);
                            }
                        }
                    }}
                    disabled={disabled}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    min={min}
                    max={max}
                    step={step}
                    dir={dir}
                    autoComplete={autoComplete}
                    className={`flex-1 bg-transparent appearance-none focus:outline-none p-3 text-sm focus:ring-0 disabled:opacity-30
                        ${
                        error
                            ? "text-red-600 dark:text-red-400 focus:border-red-500"
                            : "text-gray-900 dark:text-white focus:border-blue-900 dark:focus:border-slate-400"
                    }
                    ${leftComponent ? "rounded-r-none" : "rounded-md"}
                    ${className}`}
                />
                {leftComponent && leftComponent}
            </div>
            <label
                htmlFor={id}
                className={`absolute text-sm right-3 duration-100 transform px-2 select-none pointer-events-none top-3.5 -translate-y-6 scale-75 peer-placeholder-shown:top-2.5 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 dark:peer-placeholder-shown:text-white peer-focus:top-3.5 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-900 bg-white dark:bg-slate-800
                ${
                    error
                        ? "text-red-500 dark:text-red-400 peer-focus:text-red-500 dark:peer-focus:text-red-400 peer-disabled:text-red-500/30 dark:peer-disabled:text-red-400/30"
                        : "text-gray-500 dark:text-white peer-focus:text-blue-900 dark:peer-focus:text-slate-400 peer-disabled:text-gray-500/30 dark:peer-disabled:text-white/30"
                }`}
            >
                {label}
                {required && (
                    <span className="text-red-500 dark:text-red-400 mr-1">*</span>
                )}
            </label>

            {error && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center disabled:opacity-30 peer-disabled:text-red-500/30 dark:peer-disabled:text-red-400/30">
                    <BadgeAlert className={`w-3 h-3 ml-1`}></BadgeAlert>
                    {error}
                </p>
            )}
        </div>
    );
}
