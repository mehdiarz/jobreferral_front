import { apiClient } from "../../libs/api";
import type { GetAllRequestTypesParams, RequestTypeItem } from "./types";

export interface GetAllRequestTypesResponse {
  items: RequestTypeItem[];
  totalCount: number;
}

export async function getAllRequestTypes(
  params?: GetAllRequestTypesParams,
): Promise<GetAllRequestTypesResponse> {
  const searchParams = new URLSearchParams();

  const title = params?.title?.trim();
  const code = params?.code?.trim();
  const description = params?.description?.trim();
  const sorting = params?.sorting?.trim();

  if (title) {
    searchParams.set("Title", title);
  }

  if (code) {
    searchParams.set("Code", code);
  }

  if (description) {
    searchParams.set("Description", description);
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
    ? `/services/app/RequestTypeCrud/GetAll?${query}`
    : "/services/app/RequestTypeCrud/GetAll";

  const res = await apiClient.request<{
    result?: {
      items?: RequestTypeItem[];
      totalCount?: number;
    };
    items?: RequestTypeItem[];
    totalCount?: number;
  }>(url, {
    method: "GET",
  });

  const items: RequestTypeItem[] = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
