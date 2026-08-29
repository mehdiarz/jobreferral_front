export interface JudicialExpertRegionInputDto {
  regionId: number;
  branchCodes?: number[] | null;
}

export interface JudicialExpertRegionOutputDto {
  regionId: number;
  region?: unknown | null;
  branchCodes?: number[] | null;
  branches?: unknown[] | null;
}

export interface ExpertiseZoneItem {
  id: number;
  title?: string | null;
  code?: string | null;
}

/**
 * مدل ارسالی برای ثبت کارشناس
 */
export interface CreateExpertBody {
  firstName?: string | null;
  lastName?: string | null;
  code?: string | null;
  rank: number;
  licenseIssueDate?: string | null;
  licenseExpireDate?: string | null;
  licenseNumber?: string | null;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  isActive: boolean;
  regions?: JudicialExpertRegionInputDto[] | null;

  /**
   * شناسه حوزه‌های تخصصی انتخاب‌شده
   */
  expertiseZoneIds?: number[] | null;
}

/**
 * مدل ویرایش کارشناس
 */
export interface EditExpertBody extends CreateExpertBody {
  id: number;
}

/**
 * مدل دریافتی کارشناس از API
 */
export interface ExpertItem {
  id: number;
  firstName: string | null;
  lastName: string | null;
  code: string | null;
  rank: number;
  licenseIssueDate: string | null;
  licenseExpireDate: string | null;
  licenseNumber: string | null;
  phoneNumber: string | null;
  mobileNumber: string | null;
  email: string | null;

  isActive: boolean;
  regions: JudicialExpertRegionOutputDto[] | null;

  /**
   * شناسه حوزه‌های تخصصی کارشناس
   */
  expertiseZoneIds: number[] | null;

  /**
   * اطلاعات کامل حوزه‌های تخصصی؛ در صورت ارسال Backend
   */
  expertiseZones: ExpertiseZoneItem[] | null;

  creationTime: string;
  lastModificationTime: string | null;
  isDeleted: boolean;
}

export interface GetAllExpertsParams {
  firstName?: string;
  lastName?: string;
  code?: string;
  expertiseZoneTitle?: string;
  licenseNumber?: string;
  isCapital?: boolean;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface GetAllExpertsResponse {
  items: ExpertItem[];
  totalCount: number;
}

export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}
