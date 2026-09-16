import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetPagedRequestsParams,
  RequestReportDtoPagedResultDto,
} from "./types";

export async function getPagedRequests(
  params: GetPagedRequestsParams = {},
): Promise<RequestReportDtoPagedResultDto> {
  const searchParams = new URLSearchParams();

  // فیلترهای متنی
  if (params.requestTitleFilter?.trim()) {
    searchParams.set("RequestTitleFilter", params.requestTitleFilter.trim());
  }
  if (params.branchId != null && String(params.branchId).trim() !== "") {
    searchParams.set("BranchId", String(params.branchId).trim());
  }
  if (params.supersvisionId?.trim()) {
    searchParams.set("SupersvisionId", params.supersvisionId.trim());
  }
  if (params.sorting?.trim()) {
    searchParams.set("Sorting", params.sorting.trim());
  }

  // فیلترهای عددی و شناسه‌ها
  if (
    params.requestStatusCode !== undefined &&
    params.requestStatusCode !== null
  ) {
    searchParams.set("RequestStatusCode", String(params.requestStatusCode));
  }
  if (
    params.authorityDepartmentTypeId !== undefined &&
    params.authorityDepartmentTypeId !== null
  ) {
    searchParams.set(
      "AuthorityDepartmentTypeId",
      String(params.authorityDepartmentTypeId),
    );
  }
  if (
    params.currentDepartmentTypeId !== undefined &&
    params.currentDepartmentTypeId !== null
  ) {
    searchParams.set(
      "CurrentDepartmentTypeId",
      String(params.currentDepartmentTypeId),
    );
  }
  if (
    params.creatorDepartmentTypeId !== undefined &&
    params.creatorDepartmentTypeId !== null
  ) {
    searchParams.set(
      "CreatorDepartmentTypeId",
      String(params.creatorDepartmentTypeId),
    );
  }
  if (params.actorUserId !== undefined && params.actorUserId !== null) {
    searchParams.set("ActorUserId", String(params.actorUserId));
  }
  if (params.personalTypeId !== undefined && params.personalTypeId !== null) {
    searchParams.set("PersonalTypeId", String(params.personalTypeId));
  }
  if (params.customerId !== undefined && params.customerId !== null) {
    searchParams.set("CustomerId", String(params.customerId));
  }
  if (params.departmentId !== undefined && params.departmentId !== null) {
    searchParams.set("DepartmentId", String(params.departmentId));
  }
  if (params.requestTypeId !== undefined && params.requestTypeId !== null) {
    searchParams.set("RequestTypeId", String(params.requestTypeId));
  }

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
    AbpResponse<RequestReportDtoPagedResultDto>
  >(
    `/services/app/RequestReport/GetPagedRequests${
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
