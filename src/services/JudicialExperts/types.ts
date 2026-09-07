export interface RegionOutputDto {
  id: number;
  name?: string | null;
  code?: string | null;
  [key: string]: unknown;
}

export interface BranchOutputDto {
  id: number;
  code?: number | null;
  name?: string | null;
  [key: string]: unknown;
}

export interface JudicialExpertRegionInputDto {
  regionId: number;
  branchCodes?: number[] | null;
}

export interface JudicialExpertRegionOutputDto {
  regionId: number;
  region?: RegionOutputDto | null;
  branchCodes?: number[] | null;
  branches?: BranchOutputDto[] | null;
}

export interface ExpertiseZoneItem {
  id: number;
  title?: string | null;
  code?: string | null;
  description?: string | null;
  creationTime: string;
  lastModificationTime?: string | null;
  deletionTime?: string | null;
  isDeleted: boolean;
}

/**
 * مدل ارسالی برای ثبت کارشناس (JudicialExpertInputDto)
 */
export interface CreateExpertBody {
  id?: number;
  firstName?: string | null;
  lastName?: string | null;
  code: string; // در OpenAPI الزامی است
  rank?: number;
  licenseIssueDate?: string | null;
  licenseExpireDate?: string | null;
  licenseNumber?: string | null;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  isActive?: boolean;
  expertiseZoneCodes?: string[] | null;
  regions?: JudicialExpertRegionInputDto[] | null;
  expertiseZoneIds?: number[] | null;
}

/**
 * مدل ویرایش کارشناس
 */
export interface EditExpertBody extends CreateExpertBody {
  id: number;
}

/**
 * مدل خروجی کارشناس (JudicialExpertOutputDto)
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
  isDeleted: boolean;
  creationTime: string;
  lastModificationTime: string | null;
  expertiseZoneCodes: string[] | null;
  regions: JudicialExpertRegionOutputDto[] | null;
  expertiseZones: ExpertiseZoneItem[] | null;
}

export interface GetAllExpertsParams {
  firstName?: string;
  lastName?: string;
  code?: string;
  expertiseZoneTitle?: string | string[];
  expertiseZoneCodes?: string[];
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
