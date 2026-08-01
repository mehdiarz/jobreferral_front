import { apiClient } from "../../libs/api";
import type { RequestItem } from "./types";

export async function getRequest(id: number): Promise<RequestItem> {
  const res = await apiClient.request<{ result: RequestItem }>(
    `/services/app/RequestCrud/Get?Id=${id}`,
    { method: "GET" },
  );
  return (res as any)?.result ?? res;
}
