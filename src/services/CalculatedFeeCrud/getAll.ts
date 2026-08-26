import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetAllCalculatedFeesParams,
  GetAllCalculatedFeesResponse,
} from "./types";

export async function getAllCalculatedFees(
  params: GetAllCalculatedFeesParams = {},
): Promise<GetAllCalculatedFeesResponse> {
  const searchParams = new URLSearchParams();

  const sorting = params.sorting?.trim();

  if (params.requestId !== undefined) {
    searchParams.set("RequestId", String(params.requestId));
  }

  if (params.actorUserId !== undefined) {
    searchParams.set("ActorUserId", String(params.actorUserId));
  }

  if (params.departmentId !== undefined) {
    searchParams.set("DepartmentId", String(params.departmentId));
  }

  if (params.branchCode !== undefined) {
    searchParams.set("BranchCode", String(params.branchCode));
  }

  if (params.supervisionCode !== undefined) {
    searchParams.set("SupervisionCode", String(params.supervisionCode));
  }

  if (sorting) {
    searchParams.set("Sorting", sorting);
  }

  if (params.skipCount !== undefined) {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (params.maxResultCount !== undefined) {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const queryString = searchParams.toString();

  const response = await apiClient.request<
    AbpResponse<GetAllCalculatedFeesResponse>
  >(
    `/services/app/CalculatedFee/GetAll${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );

  return {
    items: response.result.items ?? [],
    totalCount: response.result.totalCount ?? 0,
  };
}
