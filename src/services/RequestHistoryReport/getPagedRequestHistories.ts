import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetPagedRequestHistoriesParams,
  RequestHistoryReportDtoPagedResultDto,
} from "./types";

export async function getPagedRequestHistories(
  params: GetPagedRequestHistoriesParams = {},
): Promise<RequestHistoryReportDtoPagedResultDto> {
  const searchParams = new URLSearchParams();

  // فیلترهای متنی
  if (params.requestCode?.trim()) {
    searchParams.set("RequestCode", params.requestCode.trim());
  }
  if (params.requestTitleFilter?.trim()) {
    searchParams.set("RequestTitleFilter", params.requestTitleFilter.trim());
  }
  if (params.requestLoanNumber?.trim()) {
    searchParams.set("RequestLoanNumber", params.requestLoanNumber.trim());
  }
  if (params.actorNameFilter?.trim()) {
    searchParams.set("ActorNameFilter", params.actorNameFilter.trim());
  }
  if (params.sorting?.trim()) {
    searchParams.set("Sorting", params.sorting.trim());
  }
  if (params.branchId?.trim()) searchParams.set("BranchId", params.branchId.trim());
  if (params.supersvisionId?.trim()) searchParams.set("SupersvisionId", params.supersvisionId.trim());

  // فیلترهای عددی و شناسه‌ها
  if (params.requestId !== undefined && params.requestId !== null) {
    searchParams.set("RequestId", String(params.requestId));
  }
  if (params.reviewerUserId !== undefined && params.reviewerUserId !== null) {
    searchParams.set("ReviewerUserId", String(params.reviewerUserId));
  }
  const numericParams: Array<[string, number | undefined]> = [
    ["RequestStatusCode", params.requestStatusCode],
    ["AuthorityDepartmentTypeId", params.authorityDepartmentTypeId],
    ["CurrentDepartmentTypeId", params.currentDepartmentTypeId],
    ["CreatorDepartmentTypeId", params.creatorDepartmentTypeId],
    ["ActorUserId", params.actorUserId],
    ["PersonalTypeId", params.personalTypeId],
    ["CustomerId", params.customerId],
    ["DepartmentId", params.departmentId],
    ["RequestTypeId", params.requestTypeId],
  ];
  numericParams.forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.set(key, String(value));
  });

  // فیلترهای تاریخ
  if (params.fromDate) {
    searchParams.set("FromDate", params.fromDate);
  }
  if (params.toDate) {
    searchParams.set("ToDate", params.toDate);
  }

  // صفحه‌بندی
  if (params.skipCount !== undefined) {
    searchParams.set("SkipCount", String(params.skipCount));
  }
  if (params.maxResultCount !== undefined) {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const queryString = searchParams.toString();

  const response = await apiClient.request<
    AbpResponse<RequestHistoryReportDtoPagedResultDto>
  >(
    `/services/app/RequestHistoryReport/GetPagedRequestHistories${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
    },
  );

  return {
    items: response.result?.items ?? [],
    totalCount: response.result?.totalCount ?? 0,
  };
}
