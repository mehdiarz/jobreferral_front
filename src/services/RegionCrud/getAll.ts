import { apiClient } from "../../libs/api";

export interface RegionItem {
  id: number;
  code: string | null;
  title: string | null;
  description: string | null;
  creationTime: string;
  lastModificationTime: string | null;
  isDeleted: boolean;
}

export interface GetAllRegionsParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  title?: string;
  description?: string;
  code?: string;
}

export interface GetAllRegionsResponse {
  items: RegionItem[];
  totalCount: number;
}

export async function getAllRegions(
  params?: GetAllRegionsParams,
): Promise<GetAllRegionsResponse> {
  const searchParams = new URLSearchParams();

  const title = params?.title?.trim();
  const description = params?.description?.trim();
  const code = params?.code?.trim();
  const sorting = params?.sorting?.trim();

  if (title) {
    searchParams.set("Title", title);
  }

  if (description) {
    searchParams.set("Description", description);
  }

  if (code) {
    searchParams.set("Code", code);
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
    ? `/services/app/RegionCrud/GetAll?${query}`
    : "/services/app/RegionCrud/GetAll";

  const res = await apiClient.request<{
    result?: {
      items?: RegionItem[];
      totalCount?: number;
    };
    items?: RegionItem[];
    totalCount?: number;
  }>(url, {
    method: "GET",
  });

  const items: RegionItem[] = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
