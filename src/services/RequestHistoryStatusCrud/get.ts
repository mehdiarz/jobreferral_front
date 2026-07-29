import { apiClient } from "../../libs/api";
import type { RequestHistoryStatusItem } from "./types";

export async function getRequestHistoryStatus(
  id: number,
): Promise<RequestHistoryStatusItem> {
  return apiClient.request<RequestHistoryStatusItem>(
    `/services/app/RequestHistoryStatus/Get?Id=${id}`,
    { method: "GET" },
  );
}
