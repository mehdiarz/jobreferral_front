import { apiClient } from "../../libs/api";
import type { EditRequestHistoryBody, RequestHistoryItem } from "./types";

export async function editRequestHistory(
  body: EditRequestHistoryBody,
): Promise<RequestHistoryItem> {
  return apiClient.request<RequestHistoryItem>(
    "/services/app/RequestHistoryCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
