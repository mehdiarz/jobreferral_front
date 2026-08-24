import { apiClient } from "../../libs/api";
import type { BranchItem, GetAllBranchesParams } from "./types";

export interface GetAllBranchesResponse {
  items: BranchItem[];
  totalCount: number;
}

export async function getAllBranches(
  params?: GetAllBranchesParams,
): Promise<GetAllBranchesResponse> {
  const searchParams = new URLSearchParams();

  const sorting = params?.sorting?.trim();

  if (typeof params?.regionCode === "number") {
    searchParams.set("RegionCode", String(params.regionCode));
  }

  if (sorting) {
    searchParams.set("Sorting", sorting);
  }

  if (typeof params?.skipCount === "number") {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (typeof params?.maxResultCount === "number") {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const query = searchParams.toString();

  const url = query
    ? `/services/app/BranchCrud/GetAll?${query}`
    : "/services/app/BranchCrud/GetAll";

  const res = await apiClient.request<{
    result?: {
      items?: BranchItem[];
      totalCount?: number;
    };
    items?: BranchItem[];
    totalCount?: number;
  }>(url, {
    method: "GET",
  });

  const items = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
