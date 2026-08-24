// src/utils/iranValidators.ts

/**
 * تبدیل اعداد فارسی و عربی به انگلیسی
 */
export function toEnglishDigits(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

/**
 * فقط اعداد انگلیسی را نگه می‌دارد.
 */
export function onlyDigits(value: string): string {
  return toEnglishDigits(value).replace(/\D/g, "");
}

/**
 * اعتبارسنجی کد ملی ایران
 *
 * قوانین:

 *
 * قوانین:
 * - دقیقاً ۱۰ رقم
 * - همه ا باشند
 * - رقم آخر باید با الگوریتم رقم کنترلی مطابقت داشته باشد
 */
export function isValidIranianNationalCode(value: string): boolean {
  const code = onlyDigits(value);

  if (!/^\d{10}$/.test(code)) {
    return false;
  }

  // مانند 0000000000، 1111111111 و ...
  if (/^(\d)\1{9}$/.test(code)) {
    return false;
  }

  const digits = code.split("").map(Number);

  const weightedSum = digits.slice(0, 9).reduce((sum, digit, index) => {
    return sum + digit * (10 - index);
  }, 0);

  const remainder = weightedSum % 11;
  const controlDigit = digits[9];

  const expectedControlDigit = remainder < 2 ? remainder : 11 - remainder;

  return controlDigit === expectedControlDigit;
}

/**
 * شماره را به فرمت استاندارد داخلی تبدیل می‌کند:
 *
 * 09121234567   -> 09121234567
 * 9121234567    -> 09121234567
 * +989121234567 -> 09121234567
 * 00989121234567 -> 09121234567
 */
export function normalizeIranianMobile(value: string): string {
  let mobile = toEnglishDigits(value)
    .trim()
    .replace(/[\s()-]/g, "");

  if (mobile.startsWith("+98")) {
    mobile = `0${mobile.slice(3)}`;
  } else if (mobile.startsWith("0098")) {
    mobile = `0${mobile.slice(4)}`;
  } else if (mobile.startsWith("98") && mobile.length === 12) {
    mobile = `0${mobile.slice(2)}`;
  } else if (mobile.startsWith("9") && mobile.length === 10) {
    mobile = `0${mobile}`;
  }

  return mobile;
}

/**
 * اعتبارسنجی فرمت شماره موبایل ایران
 */
export function isValidIranianMobile(value: string): boolean {
  const mobile = normalizeIranianMobile(value);

  return /^09\d{9}$/.test(mobile);
}
