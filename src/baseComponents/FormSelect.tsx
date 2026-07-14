import { ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BadgeAlert } from 'lucide-react'

interface Option<T extends string | number> {
    id: T;
    title: string;
}

interface FormSelectProps<T extends string | number> {
    id: string;
    name: string;
    value: T | "";
    onChange: (value: string) => void;
    label: string;
    disabled?: boolean;
    error?: string;
    options?: Option<T>[];
    queryFn?: () => Promise<unknown>;
    queryKey?: string[];
    className?: string;
    required?: boolean;
    dir?: 'ltr' | 'rtl';
}

export default function FormSelect<T extends string | number>({
                                                                  id,
                                                                  name,
                                                                  value,
                                                                  onChange,
                                                                  label,
                                                                  disabled = false,
                                                                  error,
                                                                  options: staticOptions,
                                                                  queryFn,
                                                                  queryKey,
                                                                  dir = "rtl",
                                                                  className = "",
                                                                  required = false,
                                                              }: FormSelectProps<T>) {

    const isAsync = !!queryFn && !!queryKey;
    const [fetchedOptions, setFetchedOptions] = useState<Option<T>[]>([]);

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: queryKey || [],
        queryFn: queryFn || (() => Promise.resolve({ data: [] })),
        enabled: isAsync,
        staleTime: 0,
        refetchOnMount: 'always',
    });

    useEffect(() => {
        if (data) {
            const typedData = data as { data: Option<T>[] };
            setFetchedOptions(typedData.data ?? []);
        }
    }, [data]);

    const finalOptions = isAsync ? fetchedOptions : staticOptions || [];
    const isDisabled = disabled || (isAsync && (isLoading || isError));
    const finalError =
        error || (isAsync && isError ? "خطا در بارگذاری داده‌ها" : undefined);

    return (
        <div className="relative w-full m-1">
            <select
                dir={dir}
                id={id}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled || isLoading}
                className={`block w-full bg-transparent border appearance-none focus:outline-none rounded-md peer p-3 text-sm focus:ring-0 dark:[&>option]:text-black rtl:direction-rtl [unicode-bidi:plaintext] text-black dark:text-white
                ${error
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 dark:border-slate-500 text-gray-900 dark:text-white focus:border-blue-900 dark:focus:border-slate-400"}
                    ${className}`}
            >
                {isLoading ? (
                    <option value="" className="text-right" dir="rtl">در حال بارگذاری...</option>
                ) : (
                    <>
                        <option value="" className="text-right" dir="rtl">انتخاب کنید</option>
                        {finalOptions.map((option) => (
                            <option key={option.id} value={option.id} dir={dir}
                                    className={dir === "rtl" ? "text-right" : "text-left"}>
                                {option.title}
                            </option>
                        ))}
                    </>
                )}
            </select>
            <ChevronDown
                className="absolute top-6 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none left-3" />
            <label
                htmlFor={id}
                className={`absolute text-sm right-3 duration-100 transform px-2 select-none pointer-events-none top-3.5 -translate-y-6 scale-75 peer-placeholder-shown:top-2.5 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 dark:peer-placeholder-shown:text-white peer-focus:top-3.5 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-900 bg-white dark:bg-slate-800
                ${error
                    ? "text-red-500 dark:text-red-400 peer-focus:text-red-500 dark:peer-focus:text-red-400"
                    : "text-gray-500 dark:text-white peer-focus:text-blue-900 dark:peer-focus:text-slate-400"
                }`}
            >
                {label}
                {required && <span className="text-red-500 mr-1">*</span>}
            </label>
            {finalError && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center">
                    <BadgeAlert className={`w-3 h-3 ml-1`}></BadgeAlert>{finalError}
                </p>
            )}
        </div>
    )
}