import { apiClient } from "../../libs/api";
import type { GetAllRequestCommentsParams, RequestCommentItem } from "./types";

export async function getAllRequestComments(
  params?: GetAllRequestCommentsParams,
): Promise<{ items: RequestCommentItem[]; totalCount: number }> {
  const sp = new URLSearchParams();
  if (params?.requestId) sp.set("RequestId", String(params.requestId));
  if (params?.sorting) sp.set("Sorting", params.sorting);
  if (typeof params?.skipCount === "number")
    sp.set("SkipCount", String(params.skipCount));
  if (typeof params?.maxResultCount === "number")
    sp.set("MaxResultCount", String(params.maxResultCount));
  const q = sp.toString();
  const url = q
    ? `/services/app/RequestComment/GetAll?${q}`
    : "/services/app/RequestComment/GetAll";
  const res = await apiClient.request<any>(url, { method: "GET" });
  const items = res?.items ?? res?.result?.items ?? [];
  const totalCount = res?.totalCount ?? res?.result?.totalCount ?? items.length;
  return { items, totalCount };
}
