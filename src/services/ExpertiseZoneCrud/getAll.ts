import { apiClient } from "../../libs/api";

export interface ExpertiseZoneItem {
  id: number;
  code: string | null;
  title: string | null;
  description?: string | null;
}

export interface GetAllExpertiseZonesParams {
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
  title?: string;
  code?: string;
}

export async function getAllExpertiseZones(
  params?: GetAllExpertiseZonesParams,
): Promise<{ items: ExpertiseZoneItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams();

  const title = params?.title?.trim();
  const code = params?.code?.trim();
  const sorting = params?.sorting?.trim();

  if (title) {
    searchParams.set("Title", title);
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
    ? `/services/app/ExpertiseZoneCrud/GetAll?${query}`
    : "/services/app/ExpertiseZoneCrud/GetAll";

  const res = await apiClient.request<any>(url, {
    method: "GET",
  });

  const items: ExpertiseZoneItem[] = res?.result?.items ?? res?.items ?? [];

  const totalCount = res?.result?.totalCount ?? res?.totalCount ?? items.length;

  return {
    items,
    totalCount,
  };
}
