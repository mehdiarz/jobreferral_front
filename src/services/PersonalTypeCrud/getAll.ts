import { apiClient } from "../../libs/api";
import type { GetAllPersonalTypesParams, PersonalTypeItem } from "./types";

export async function getAllPersonalTypes(
  params?: GetAllPersonalTypesParams,
): Promise<{ items: PersonalTypeItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams();

  if (params?.sorting) {
    searchParams.set("Sorting", params.sorting);
  }

  if (typeof params?.skipCount === "number") {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (typeof params?.maxResultCount === "number") {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const query = searchParams.toString();
  const url = query
    ? `/services/app/PersonalType/GetAll?${query}`
    : "/services/app/PersonalType/GetAll";

  const res = await apiClient.request<any>(url, { method: "GET" });
  const items = res?.items ?? res?.result?.items ?? [];
  const totalCount = res?.totalCount ?? res?.result?.totalCount ?? items.length;

  return { items, totalCount };
}
