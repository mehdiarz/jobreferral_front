const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * تبدیل تمام ارقام انگلیسی و عربی به ارقام فارسی
 * ورودی می‌تواند رشته، عدد، null یا undefined باشد.
 */
export const toPersianDigits = (
  value: string | number | null | undefined,
): string => {
  if (value === null || value === undefined) return "";

  return value
    .toString()
    .replace(/[0-9]/g, (char) => PERSIAN_DIGITS[parseInt(char, 10)])
    .replace(/[٠-٩]/g, (char) => {
      const index = ARABIC_DIGITS.indexOf(char);
      return index > -1 ? PERSIAN_DIGITS[index] : char;
    });
};

/**
 * تبدیل ارقام فارسی/عربی به انگلیسی (برای ارسال به سرور یا محاسبات)
 */
export const toEnglishDigits = (
  value: string | number | null | undefined,
): string => {
  if (value === null || value === undefined) return "";

  return value
    .toString()
    .replace(/[۰-۹]/g, (char) => PERSIAN_DIGITS.indexOf(char).toString())
    .replace(/[٠-٩]/g, (char) => ARABIC_DIGITS.indexOf(char).toString());
};

/**
 * فرمت سه‌رقم‌سه‌رقم با ارقام فارسی (مناسب برای مبالغ و ارزها)
 */
export const formatPersianCurrency = (
  value: string | number | null | undefined,
): string => {
  if (value === null || value === undefined || value === "") return "";

  const cleanValue = toEnglishDigits(value).replace(/[^0-9]/g, "");
  if (!cleanValue) return "";

  const withCommas = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, "،");
  return toPersianDigits(withCommas);
};
