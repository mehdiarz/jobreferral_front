import { apiClient } from "../../libs/api";
import type {
  GetAllRequestHistoryStatusParams,
  RequestHistoryStatusItem,
} from "./types";

export async function getAllRequestHistoryStatus(
  params?: GetAllRequestHistoryStatusParams,
): Promise<{ items: RequestHistoryStatusItem[]; totalCount: number }> {
  const sp = new URLSearchParams();
  if (params?.sorting) sp.set("Sorting", params.sorting);
  if (typeof params?.skipCount === "number")
    sp.set("SkipCount", String(params.skipCount));
  if (typeof params?.maxResultCount === "number")
    sp.set("MaxResultCount", String(params.maxResultCount));
  const q = sp.toString();
  const url = q
    ? `/services/app/RequestHistoryStatus/GetAll?${q}`
    : "/services/app/RequestHistoryStatus/GetAll";
  const res = await apiClient.request<any>(url, { method: "GET" });
  return {
    items: res?.items ?? res?.result?.items ?? [],
    totalCount: res?.totalCount ?? res?.result?.totalCount ?? 0,
  };
}
