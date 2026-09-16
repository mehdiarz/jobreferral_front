export interface AbpResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: unknown | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

/**
 * مدل هر آیتم در تاریخچه درخواست‌ها
 */
export interface RequestHistoryReportDto {
  id?: number;
  requestId?: number;
  requestCode?: string | null;
  requestTitle?: string | null;
  requestLoanNumber?: string | null;
  reviewerUserId?: number | null;
  reviewerUserName?: string | null;
  actorName?: string | null;
  actionDate?: string | null;
  creationTime?: string;
  [key: string]: unknown;
}

/**
 * پارامترهای ورودی متد GetPagedRequestHistories (Query String)
 */
export interface GetPagedRequestHistoriesParams {
  requestId?: number;
  requestCode?: string;
  requestTitleFilter?: string;
  requestLoanNumber?: string;
  reviewerUserId?: number;
  actorNameFilter?: string;
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  supersvisionId?: string;
  requestStatusCode?: number;
  authorityDepartmentTypeId?: number;
  currentDepartmentTypeId?: number;
  creatorDepartmentTypeId?: number;
  actorUserId?: number;
  personalTypeId?: number;
  customerId?: number;
  departmentId?: number;
  requestTypeId?: number;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

/**
 * مدل خروجی صفحه‌بندی شده تاریخچه درخواست‌ها
 */
export interface RequestHistoryReportDtoPagedResultDto {
  items: RequestHistoryReportDto[];
  totalCount: number;
}

/**
 * مدل ورودی خروجی اکسل تاریخچه درخواست‌ها (GetRequestHistoryReportInput)
 */
export interface GetRequestHistoryReportInput {
  maxResultCount?: number;
  skipCount?: number;
  sorting?: string | null;
  requestId?: number | null;
  requestCode?: string | null;
  requestTitleFilter?: string | null;
  requestLoanNumber?: string | null;
  reviewerUserId?: number | null;
  actorNameFilter?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  branchId?: string | null;
  supersvisionId?: string | null;
  requestStatusCode?: number | null;
  authorityDepartmentTypeId?: number | null;
  currentDepartmentTypeId?: number | null;
  creatorDepartmentTypeId?: number | null;
  actorUserId?: number | null;
  personalTypeId?: number | null;
  customerId?: number | null;
  departmentId?: number | null;
  requestTypeId?: number | null;
}
