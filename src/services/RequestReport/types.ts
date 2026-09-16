export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

/**
 * مدل هر آیتم در گزارش درخواست‌ها
 */
export interface RequestReportDto {
  id?: number;
  requestTitle?: string | null;
  requestStatusCode?: number | null;
  requestStatusTitle?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  authorityDepartmentTypeId?: number | null;
  currentDepartmentTypeId?: number | null;
  creatorDepartmentTypeId?: number | null;
  actorUserId?: number | null;
  actorUserName?: string | null;
  personalTypeId?: number | null;
  supersvisionId?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  requestTypeId?: number | null;
  requestTypeTitle?: string | null;
  creationTime?: string;
  [key: string]: unknown;
}

/**
 * پارامترهای ورودی متد GetPagedRequests (Query String)
 */
export interface GetPagedRequestsParams {
  requestTitleFilter?: string;
  requestStatusCode?: number;
  branchId?: string;
  authorityDepartmentTypeId?: number;
  currentDepartmentTypeId?: number;
  creatorDepartmentTypeId?: number;
  actorUserId?: number;
  personalTypeId?: number;
  supersvisionId?: string;
  customerId?: number;
  departmentId?: number;
  requestTypeId?: number;
  fromDate?: string;
  toDate?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

/**
 * مدل خروجی صفحه‌بندی شده گزارش درخواست‌ها
 */
export interface RequestReportDtoPagedResultDto {
  items: RequestReportDto[];
  totalCount: number;
}

/**
 * مدل ورودی خروجی اکسل (GetRequestReportInput)
 */
export interface GetRequestReportInput {
  maxResultCount?: number;
  skipCount?: number;
  sorting?: string | null;
  requestTitleFilter?: string | null;
  requestStatusCode?: number | null;
  branchId?: string | null;
  authorityDepartmentTypeId?: number | null;
  currentDepartmentTypeId?: number | null;
  creatorDepartmentTypeId?: number | null;
  actorUserId?: number | null;
  personalTypeId?: number | null;
  supersvisionId?: string | null;
  customerId?: number | null;
  departmentId?: number | null;
  requestTypeId?: number | null;
  fromDate?: string | null;
  toDate?: string | null;
}
