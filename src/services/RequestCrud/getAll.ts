import { apiClient } from "../../libs/api";
import type { GetAllRequestsParams, RequestItem } from "./types";

interface GetAllRequestsResponse {
  items?: RequestItem[];
  totalCount?: number;

  result?: {
    items?: RequestItem[];
    totalCount?: number;
  };
}

export async function getAllRequests(params?: GetAllRequestsParams): Promise<{
  items: RequestItem[];
  totalCount: number;
}> {
  const searchParams = new URLSearchParams();

  const actorUserFullName = params?.actorUserFullName?.trim();
  const requestStatusTitle = params?.requestStatusTitle?.trim();
  const authorityDepartmentTypeName =
    params?.authorityDepartmentTypeName?.trim();
  const currentDepartmentTypeName = params?.currentDepartmentTypeName?.trim();

  if (actorUserFullName) {
    searchParams.set("ActorUserFullName", actorUserFullName);
  }

  if (requestStatusTitle) {
    searchParams.set("RequestStatusTitle", requestStatusTitle);
  }

  if (params?.creationTime) {
    const creationTime =
      params.creationTime instanceof Date
        ? params.creationTime.toISOString()
        : params.creationTime;

    if (creationTime) {
      searchParams.set("CreationTime", creationTime);
    }
  }

  if (authorityDepartmentTypeName) {
    searchParams.set(
      "AuthorityDepartmentTypeName",
      authorityDepartmentTypeName,
    );
  }

  if (currentDepartmentTypeName) {
    searchParams.set("CurrentDepartmentTypeName", currentDepartmentTypeName);
  }

  if (params?.sorting?.trim()) {
    searchParams.set("Sorting", params.sorting.trim());
  }

  if (typeof params?.skipCount === "number") {
    searchParams.set("SkipCount", String(Math.max(0, params.skipCount)));
  }

  if (typeof params?.maxResultCount === "number") {
    searchParams.set(
      "MaxResultCount",
      String(Math.max(1, params.maxResultCount)),
    );
  }

  const query = searchParams.toString();

  const url = query
    ? `/services/app/RequestCrud/GetAll?${query}`
    : "/services/app/RequestCrud/GetAll";

  const response = await apiClient.request<GetAllRequestsResponse>(url, {
    method: "GET",
  });

  const items = response?.result?.items ?? response?.items ?? [];

  const totalCount =
    response?.result?.totalCount ?? response?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
