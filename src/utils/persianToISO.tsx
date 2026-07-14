/**
 * تبدیل تاریخ شمسی (yyyy-mm-dd) به میلادی ISO 8601
 * @param persianDate رشته تاریخ شمسی "۱۴۰۴-۰۶-۰۲" یا "1404-06-02"
 * @returns رشته ISO میلادی با زمان صفر UTC
 */
/**
 * تبدیل تاریخ شمسی (yyyy-mm-dd) به میلادی ISO 8601
 * @param persianDate رشته تاریخ شمسی "۱۴۰۴-۰۶-۰۲" یا "1404-06-02"
 * @returns رشته ISO میلادی با زمان صفر UTC
 */
export function persianToISO(persianDate: string): string {
  if (!persianDate || !persianDate.trim()) {
    return "";
  }

  try {
    // 1) تبدیل ارقام فارسی به انگلیسی
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDate = persianDate.replace(/[۰-۹]/g, d =>
        persianDigits.indexOf(d).toString()
    );

    const parts = englishDate.split(/[-\/]/); // پشتیبانی از - و /
    if (parts.length !== 3) {
      return ""; // فرمت نامعتبر - تاریخ رو خالی برمی‌گردونه
    }

    const jy = Number(parts[0]);
    const jm = Number(parts[1]);
    const jd = Number(parts[2]);

    // اعتبارسنجی محدوده‌ها
    if (isNaN(jy) || isNaN(jm) || isNaN(jd)) {
      return "";
    }

    if (jy < 1300 || jy > 1500 || jm < 1 || jm > 12 || jd < 1 || jd > 31) {
      return "";
    }

    // 2) تبدیل جلالی به میلادی با الگوریتم استاندارد
    const { gy, gm, gd } = jalaaliToGregorian(jy, jm, jd);

    // 3) ساخت تاریخ UTC و تبدیل به ISO
    const date = new Date(Date.UTC(gy, gm - 1, gd, 0, 0, 0));

    // چک معتبر بودن date
    if (isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString();
  } catch {
    return "";
  }
}

/**
 * تبدیل تاریخ جلالی به میلادی (الگوریتم استاندارد)
 * @param jy سال جلالی
 * @param jm ماه جلالی (1-12)
 * @param jd روز جلالی (1-31)
 */
function jalaaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111,
    1181, 1210, 1635, 2060, 2097, 2192, 2262,
    2324, 2394, 2456, 3178
  ];

  let gy: number, gm: number, gd: number;
  let leapJ = -14;
  let jp = breaks[0];
  let jmIndex: number, jump: number, n: number, i: number;

  for (i = 1; i < breaks.length; i++) {
    jmIndex = breaks[i];
    jump = jmIndex - jp;
    if (jy < jmIndex) {
      break;
    }
    leapJ += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
    jp = jmIndex;
  }

  n = jy - jp;
  leapJ += Math.floor(n / 33) * 8 + Math.floor((n % 33 + 3) / 4);

  const leapG = Math.floor((jy + 621) / 4) - Math.floor(((jy + 621) / 100 + 1) * 3 / 4) - 150;
  const march = 20 + leapJ - leapG;

  const jDayNo =
    365 * (jy - 1) +
    Math.floor((8 * (jy - 1) + 21) / 33) +
    jd +
    (jm <= 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  const gDayNo = jDayNo + (march - 1);

  gy = 621 + jy + Math.floor(gDayNo / 365.2425);
  let d = gDayNo - Math.floor((gy - 621) * 365.2425);

  const gMonthDays = [31, isGregorianLeap(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  gm = 0;
  for (let m = 0; m < 12 && d >= 0; m++) {
    if (d < gMonthDays[m]) {
      gm = m + 1;
      gd = d + 1;
      return { gy, gm, gd };
    }
    d -= gMonthDays[m];
  }

  // Fallback (should not happen)
  gd = d + 1;
  gm = 12;
  return { gy, gm, gd };
}

function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}


// مثال استفاده:
console.log(persianToISO("۱۴۰۴-۰۶-۰۲"));
// خروجی: "2025-08-24T00:00:00.000Z"

/**
 * Formats a number as Iranian Rial currency with comma separators (no decimals)
 * @param value - The number to format
 * @returns Formatted string with comma separators
 */
export function formatCurrency(value: string | number): string {
  if (!value) return '';

  // Convert to string and remove any existing commas
  const stringValue = value.toString().replace(/,/g, '');

  // Remove any non-digit characters except decimal point
  const cleanValue = stringValue.replace(/[^\d.]/g, '');

  // For Iranian Rial, we don't want decimals, so remove decimal part if exists
  const parts = cleanValue.split('.');
  const integerPart = parts[0];

  // Add comma separators every 3 digits
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Removes formatting from a currency string to get the raw number
 * @param formattedValue - The formatted currency string
 * @returns Raw number string without commas
 */
export function unformatCurrency(formattedValue: string): string {
  if (!formattedValue) return '';
  return formattedValue.replace(/,/g, '');
}

//---

/**
 * تبدیل تاریخ میلادی ISO به شمسی (yyyy-mm-dd)
 * @param isoDate مثال: "2026-05-13T10:18:01.5530524"
 * @returns تاریخ شمسی مثل: "1405-02-23"
 */
export function isoToPersian(isoDate: string): string {
  const date = new Date(isoDate);

  const gy = date.getUTCFullYear();
  const gm = date.getUTCMonth() + 1;
  const gd = date.getUTCDate();

  const { jy, jm, jd } = gregorianToJalaali(gy, gm, gd);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${jy}-${pad(jm)}-${pad(jd)}`;
}

function gregorianToJalaali(
  gy: number,
  gm: number,
  gd: number
): { jy: number; jm: number; jd: number } {
  const gDaysInMonth = [31, isGregorianLeap(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let gy2 = gy - 1600;
  let gm2 = gm - 1;
  let gd2 = gd - 1;

  let gDayNo =
    365 * gy2 +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400);

  for (let i = 0; i < gm2; ++i) gDayNo += gDaysInMonth[i];
  gDayNo += gd2;

  let jDayNo = gDayNo - 79;

  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;

  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  let jm = 0;
  let jd = 0;

  for (let i = 0; i < 11 && jDayNo >= jDaysInMonth[i]; ++i) {
    jDayNo -= jDaysInMonth[i];
    jm++;
  }

  jd = jDayNo + 1;
  jm += 1;

  return { jy, jm, jd };
}
