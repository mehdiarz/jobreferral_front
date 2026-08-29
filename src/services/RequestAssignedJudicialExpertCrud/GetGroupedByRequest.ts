import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetAllRequestAssignedJudicialExpertParams,
  PagedResult,
  RequestWithJudicialExpertsItem,
} from "./types";

export async function getGroupedByRequest(
  params?: GetAllRequestAssignedJudicialExpertParams,
): Promise<PagedResult<RequestWithJudicialExpertsItem>> {
  const sp = new URLSearchParams();

  if (params?.sorting) {
    sp.set("Sorting", params.sorting);
  }
  if (typeof params?.skipCount === "number") {
    sp.set("SkipCount", String(params.skipCount));
  }
  if (typeof params?.maxResultCount === "number") {
    sp.set("MaxResultCount", String(params.maxResultCount));
  }

  const query = sp.toString();
  const url = query
    ? `/services/app/RequestAssignedJudicialExpert/GetGroupedByRequest?${query}`
    : "/services/app/RequestAssignedJudicialExpert/GetGroupedByRequest";

  const res = await apiClient.request<
    | AbpResponse<PagedResult<RequestWithJudicialExpertsItem>>
    | PagedResult<RequestWithJudicialExpertsItem>
  >(url, {
    method: "GET",
  });

  if (res && "result" in res && res.result) {
    return {
      items: res.result.items ?? [],
      totalCount: res.result.totalCount ?? 0,
    };
  }

  const paged = res as PagedResult<RequestWithJudicialExpertsItem> | undefined;
  return {
    items: paged?.items ?? [],
    totalCount: paged?.totalCount ?? 0,
  };
}
