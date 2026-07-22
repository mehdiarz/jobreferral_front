import { apiClient } from "../../libs/api";
import type { GetAllCollatralsParams, CollatralItem } from "./types";

export async function getAllCollatrals(
  params?: GetAllCollatralsParams,
): Promise<{ items: CollatralItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams();
  if (params?.requestId)
    searchParams.set("RequestId", String(params.requestId));
  if (params?.sorting) searchParams.set("Sorting", params.sorting);
  if (typeof params?.skipCount === "number")
    searchParams.set("SkipCount", String(params.skipCount));
  if (typeof params?.maxResultCount === "number")
    searchParams.set("MaxResultCount", String(params.maxResultCount));

  const query = searchParams.toString();
  const url = query
    ? `/services/app/CollatralCrud/GetAll?${query}`
    : "/services/app/CollatralCrud/GetAll";

  const res = await apiClient.request<any>(url, { method: "GET" });
  const items = res?.items ?? res?.result?.items ?? [];
  const totalCount = res?.totalCount ?? res?.result?.totalCount ?? items.length;
  return { items, totalCount };
}
