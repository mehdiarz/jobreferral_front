import { BadgeAlert, ChevronDown, Loader2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export interface SearchableComboOption {
  value: string;
  label: string;
}

export interface SearchableComboProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Load options for the given search string. Return { value, label }[]. */
  fetchOptions?: (search: string) => Promise<SearchableComboOption[]>;
  options?: SearchableComboOption[];
  /** Minimum number of characters before triggering search (default: 3). */
  minSearchLength?: number;
  /** When true and minSearchLength is 0, dropdown only opens on focus (not automatically). */
  openOnlyOnFocusWhenMinLengthZero?: boolean;
  /** Debounce delay in ms (default: 300). */
  debounceMs?: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
  className?: string;
}

const DEFAULT_MIN_LENGTH = 3;
const DEFAULT_DEBOUNCE_MS = 300;

export default function SearchableCombo({
  id,
  name,
  label,
  value,
  onChange,
  fetchOptions,
  minSearchLength = DEFAULT_MIN_LENGTH,
  openOnlyOnFocusWhenMinLengthZero = false,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  placeholder = " ",
  disabled = false,
  error,
  required = false,
  dir = "rtl",
  className = "",
  options: _options = []
}: SearchableComboProps) {
  const isAsync = !!fetchOptions;
  const [inputText, setInputText] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [options, setOptions] = useState<SearchableComboOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const displayValue = value ? selectedLabel || value : inputText;

  const loadOptions = useCallback(
    async (search: string) => {
      if (!isAsync) return;
      if (search.length < minSearchLength) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const items = await fetchOptions!(search.trim());
        setOptions(items);
        setHighlightIndex(-1);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchOptions, minSearchLength, isAsync]
  );

  useEffect(() => {
    if (isAsync) return;

    const filtered =
      inputText.trim() === ""
        ? _options
        : _options.filter((o) =>
          o.label.toLowerCase().includes(inputText.toLowerCase())
        );

    setOptions(filtered);
  }, [_options, inputText, isAsync]);


  const shouldOpenOnLoad =
    !openOnlyOnFocusWhenMinLengthZero || minSearchLength > 0;

  useEffect(() => {
    if (!isAsync) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputText.length >= minSearchLength) {
      const runSearch = () => {
        loadOptions(inputText);
        if (shouldOpenOnLoad) setOpen(true);
      };
      if (minSearchLength === 0) {
        runSearch();
      } else {
        debounceRef.current = setTimeout(runSearch, debounceMs);
      }
    } else if (!value && inputText.length > 0 && inputText.length < minSearchLength) {
      setOptions([]);
      setOpen(false);
    } else if (!value && inputText.length === 0) {
      setOptions([]);
      setOpen(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isAsync, inputText, value, minSearchLength, debounceMs, loadOptions, shouldOpenOnLoad]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setOpen(false);
      setHighlightIndex(-1);
      if (value) {
        setInputText("");
      }
    }, 150);
  }, [value]);

  const handleFocus = useCallback(() => {
    if (value) return;
    if (openOnlyOnFocusWhenMinLengthZero && minSearchLength === 0) {
      loadOptions("");
      setOpen(true);
    } else if (inputText.length >= minSearchLength && options.length > 0) {
      setOpen(true);
    }
  }, [value, inputText.length, minSearchLength, options.length, openOnlyOnFocusWhenMinLengthZero, loadOptions]);

  const handleInputClick = useCallback(() => {
    if (value) return;
    if (openOnlyOnFocusWhenMinLengthZero && minSearchLength === 0 && !open) {
      loadOptions("");
      setOpen(true);
    }
  }, [value, openOnlyOnFocusWhenMinLengthZero, minSearchLength, open, loadOptions]);

  const handleSelect = useCallback(
    (option: SearchableComboOption) => {
      onChange(option.value);
      setSelectedLabel(option.label);
      setInputText("");
      setOptions([]);
      setOpen(false);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInputText(v);
      if (value) {
        onChange("");
        setSelectedLabel("");
      }

      if (v.length >= minSearchLength) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!open || options.length === 0) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightIndex((i) => (i < options.length - 1 ? i + 1 : i));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightIndex >= 0 && options[highlightIndex]) {
            handleSelect(options[highlightIndex]);
          }
          break;
        case "Escape":
          setOpen(false);
          setHighlightIndex(-1);
          break;
        default:
          break;
      }
    },
    [open, options, highlightIndex, handleSelect]
  );

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const hasValue = !!value;
  const borderClass = error
    ? "border-red-500 focus-within:border-red-500"
    : "border-gray-300 dark:border-slate-500 focus-within:border-blue-900 dark:focus-within:border-slate-400";
  const labelClass = error
    ? "text-red-500 dark:text-red-400 peer-focus:text-red-500 dark:peer-focus:text-red-400"
    : "text-gray-500 dark:text-white peer-focus:text-blue-900 dark:peer-focus:text-slate-400";

  const showDropdown =
    open &&
    (
      isAsync
        ? inputText.length >= minSearchLength || loading
        : true
    );

  return (
    <div ref={containerRef} className={`relative w-full m-1 ${className}`}>
      <div
        className={`flex items-center border rounded-md bg-white dark:bg-slate-800 ${borderClass} ${disabled ? "opacity-60" : ""}`}
      >
        <input
          id={id}
          name={name}
          type="text"
          dir={dir}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onClick={handleInputClick}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={`peer flex-1 bg-transparent appearance-none focus:outline-none p-3 text-sm focus:ring-0 rounded-md
            text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500
            ${hasValue ? "cursor-default" : ""}`}
        />
        <div className="flex items-center gap-1 flex-shrink-0 pointer-events-none ps-2 pe-2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>
      <label
        htmlFor={id}
        className={`absolute text-sm right-3 duration-100 transform px-2 select-none pointer-events-none top-3.5 -translate-y-6 scale-75 bg-white dark:bg-slate-800 ${labelClass}`}
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {showDropdown && (
        <ul
          ref={listRef}
          dir={dir}
          className="absolute z-50 w-full mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-500 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400 text-right">
              در حال بارگذاری...
            </li>
          ) : options.length > 0 ? (
            options.map((opt, i) => (
              <li
                key={`${opt.value}-${i}`}
                role="option"
                aria-selected={highlightIndex === i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
                className={`px-3 py-2 text-sm cursor-pointer text-right
                  ${highlightIndex === i ? "bg-blue-100 dark:bg-slate-600 text-blue-900 dark:text-white" : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"}`}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400 text-right">
              نتیجه‌ای یافت نشد
            </li>
          )}
        </ul>
      )}
      {inputText.length > 0 && inputText.length < minSearchLength && !value && (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          حداقل {minSearchLength} کاراکتر وارد کنید
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center">
          <BadgeAlert className="w-3 h-3 ml-1" />
          {error}
        </p>
      )}
    </div>
  );
}
