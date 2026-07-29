import { apiClient } from "../../libs/api";
import type { CreateRequestHistoryBody, RequestHistoryItem } from "./types";

export async function createRequestHistory(
  body: CreateRequestHistoryBody,
): Promise<RequestHistoryItem> {
  return apiClient.request<RequestHistoryItem>(
    "/services/app/RequestHistoryCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
