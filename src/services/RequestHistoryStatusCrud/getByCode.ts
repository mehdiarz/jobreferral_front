import { apiClient } from "../../libs/api";
import type { RequestHistoryStatusItem } from "./types";

export async function getRequestHistoryStatusByCode(
  code: number,
): Promise<RequestHistoryStatusItem> {
  const res = await apiClient.request<any>(
    `/services/app/RequestHistoryStatus/GetByCode?code=${code}`,
    { method: "GET" },
  );
  return res?.result ?? res;
}
