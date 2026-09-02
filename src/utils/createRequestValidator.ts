// ─── Validation Functions ───
export function onlyDigits(value: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  let normalized = value || "";
  for (let i = 0; i < 10; i++) {
    normalized = normalized
      .replaceAll(persianDigits[i], String(i))
      .replaceAll(arabicDigits[i], String(i));
  }
  return normalized.replace(/\D/g, "");
}

export function isValidIranianNationalCode(value: string): boolean {
  const code = onlyDigits(value);
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const weightedSum = digits
    .slice(0, 9)
    .reduce((sum, digit, index) => sum + digit * (10 - index), 0);

  const remainder = weightedSum % 11;
  const controlDigit = digits[9];
  const expectedControlDigit = remainder < 2 ? remainder : 11 - remainder;

  return controlDigit === expectedControlDigit;
}

export function isValidIranianLegalCode(value: string): boolean {
  const code = onlyDigits(value);
  if (!/^\d{11}$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const d = digits[9] + 2;
  const coefficients = [29, 27, 23, 19, 17, 29, 27, 23, 19, 17];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += (digits[i] + d) * coefficients[i];
  }
  const remainder = sum % 11;
  const controlDigit = digits[10];
  const expectedControlDigit = remainder === 10 ? 0 : remainder;

  return controlDigit === expectedControlDigit;
}

export function isValidNationalIdentity(value: string): boolean {
  const clean = onlyDigits(value);
  if (clean.length === 10) return isValidIranianNationalCode(clean);
  if (clean.length === 11) return isValidIranianLegalCode(clean);
  return false;
}
