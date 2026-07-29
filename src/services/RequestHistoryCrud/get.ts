import { apiClient } from "../../libs/api";
import type { RequestHistoryItem } from "./types";

export async function getRequestHistory(
  id: number,
): Promise<RequestHistoryItem> {
  return apiClient.request<RequestHistoryItem>(
    `/services/app/RequestHistoryCrud/Get?Id=${id}`,
    { method: "GET" },
  );
}
