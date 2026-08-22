import type { RequestStatusItem } from "../../services/RequestStatusCrud/types";

export const REQUEST_STATUS_TITLES = {
  // شعبه
  initial: "ثبت اولیه درخواست",
  branchReview: "در انتظار بررسی توسط کارشناس شعبه",
  branchRejected: "رد شده توسط کارشناس شعبه",
  propertyReview: "بررسی و بازنگری اطلاعات ملک",
  propertyRejected: "رد شده پس از بررسی و بازنگری ملک",

  // کارشناس رسمی دادگستری
  judicialExpertReferral: "ارجاع کار به کارشناس دادگستری",
  appraisalResultUpload: "بارگذاری فایل نتیجه ارزیابی کارشناس دادگستری",
  judicialExpertEvaluationRejected:
    "رد شده پس از مرحله ارزیابی کارشناس دادگستری",
  judicialExpertReReview: "بررسی مجدد توسط کارشناس دادگستری",

  // منطقه
  engineeringExpertReferral: "ارجاع به کارتابل کارشناس مهندسی",
  engineeringExpertReview: "بررسی و امضا توسط کارشناس مهندسی",
  engineeringExpertRejected: "رد شده پس از بررسی توسط کارشناس مهندسی",
  engineeringDepartmentRepresentativeReview: "بررسی توسط نماینده دایره مهندسی",
  engineeringDepartmentRepresentativeRejected:
    "رد شده پس از بررسی توسط نماینده دایره مهندسی",
  regionManagerReview: "بررسی و امضا توسط مدیر منطقه",
  regionManagerRejected: "رد شده پس از بررسی توسط مدیر منطقه",

  // ارجاع از منطقه به ستاد
  engineeringManagementReferral: "ارجاع به کارتابل مدیریت مهندسی و پشتیبانی",

  // ستاد - مسیر قدیمی
  realEstateDepartmentHeadReview: "بررسی و امضا توسط ریاست اداره املاک",
  realEstateCircleHeadReview: "بررسی و امضا توسط رئیس دایره املاک",
  realEstateExpertReview: "بررسی توسط کارشناس املاک",
  headquartersLevel2Review: "بررسی توسط مسئول سطح 2 ستاد",
  headquartersLevel2Rejected: "رد شده پس از بررسی توسط مسئول سطح 2 ستاد",
  headquartersLevel1Review: "بررسی توسط مسئول سطح 1 ستاد",
  headquartersLevel1Rejected: "رد شده پس از بررسی توسط مسئول سطح 1 ستاد",
  realEstateDepartmentHeadRejected:
    "رد شده پس از بررسی و امضا توسط رئیس اداره املاک",
  engineeringManagerReview: "بررسی و امضا توسط مدیر مهندسی",
  branchReferralWithDescription: "درج توضیحات و ارجاع به شعبه",
  expertFeeCalculation: "محاسبه حق الزحمه",
  operationCompleted: "خاتمه عملیات",
  requestClosed: "مختومه شدن درخواست",

  engineeringManagementReturned: "بازگشت به کارتابل مدیریت مهندسی و پشتیبانی",
  realEstateDepartmentPresidentReturned:
    "بازگشت به بررسی و امضا توسط ریاست اداره املاک",
  realEstateCircleHeadReturned: "بازگشت به بررسی و امضا توسط رئیس دایره املاک",

  // ارجاعات جدید
  regionReferral: "ارجاع به کارتابل منطقه",
  engineeringManagementReferralReview:
    "بررسی و ارجاع توسط مدیریت مهندسی و پشتیبانی",

  // ستاد - مسیر جدید
  realEstateDepartmentPresidentReview: "بررسی و امضا توسط ریاست اداره املاک",
  engineeringManagementApproval: "بررسی و امضا توسط مدیریت مهندسی و پشتیبانی",
} as const;

/**
 * کدهای ثابت وضعیت‌ها براساس داده‌های فعلی Backend.
 *
 * در ارسال درخواست تغییر وضعیت، استفاده از کد توصیه می‌شود؛
 * چون عنوان «بررسی و امضا توسط ریاست اداره املاک» برای کدهای 18 و 25 تکراری است.
 */
export const REQUEST_STATUS_CODES = {
  initial: 1,
  branchReview: 2,
  branchRejected: 3,
  propertyReview: 4,
  propertyRejected: 5,

  judicialExpertReferral: 6,
  appraisalResultUpload: 7,
  judicialExpertEvaluationRejected: 8,
  judicialExpertReReview: 9,

  engineeringExpertReferral: 10,
  engineeringExpertReview: 11,
  engineeringExpertRejected: 12,
  engineeringDepartmentRepresentativeReview: 13,
  engineeringDepartmentRepresentativeRejected: 14,
  regionManagerReview: 15,
  regionManagerRejected: 16,

  engineeringManagementReferral: 17,

  // عنوان این وضعیت با کد 25 یکسان است.
  realEstateDepartmentHeadReview: 18,
  realEstateCircleHeadReview: 19,
  realEstateExpertReview: 20,
  headquartersLevel2Review: 21,
  headquartersLevel2Rejected: 22,
  headquartersLevel1Review: 23,
  headquartersLevel1Rejected: 24,

  // عنوان این وضعیت با کد 18 یکسان است.
  realEstateDepartmentPresidentReview: 25,
  realEstateDepartmentHeadRejected: 26,
  engineeringManagerReview: 27,
  branchReferralWithDescription: 28,
  expertFeeCalculation: 29,
  operationCompleted: 30,
  requestClosed: 31,

  regionReferral: 32,
  engineeringManagementReferralReview: 34,
  engineeringManagementApproval: 35,
  engineeringManagementReturned: 117,
  realEstateDepartmentPresidentReturned: 118,
  realEstateCircleHeadReturned: 119,
} as const;

export type RequestStatusKey = keyof typeof REQUEST_STATUS_TITLES;
export type RequestStatusCode =
  (typeof REQUEST_STATUS_CODES)[keyof typeof REQUEST_STATUS_CODES];

function normalize(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * دریافت کد با استفاده از عنوان وضعیت.
 *
 * برای عنوان‌های تکراری، از REQUEST_STATUS_CODES استفاده کنید؛
 * چون جست‌وجو بر اساس title نمی‌تواند بین کدهای 18 و 25 تمایز ایجاد کند.
 */
export function resolveRequestStatusCode(
  statuses: RequestStatusItem[] | undefined,
  title: string,
) {
  const wanted = normalize(title);

  return statuses?.find((status) => normalize(status.title) === wanted)?.code;
}

export function resolveRequestStatusTitle(
  statuses: RequestStatusItem[] | undefined,
  code: number | null | undefined,
  fallback?: string | null,
) {
  return (
    statuses?.find((status) => status.code === code)?.title?.trim() ||
    fallback ||
    "-"
  );
}

/**
 * دریافت عنوان تعریف‌شده در Frontend با کلید معنایی.
 */
export function getRequestStatusTitle(key: RequestStatusKey) {
  return REQUEST_STATUS_TITLES[key];
}

/**
 * دریافت کد ثابت وضعیت با کلید معنایی.
 */
export function getRequestStatusCode(key: keyof typeof REQUEST_STATUS_CODES) {
  return REQUEST_STATUS_CODES[key];
}
