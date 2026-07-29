import { apiClient } from "../../libs/api";
import type {
  EditRequestHistoryStatusBody,
  RequestHistoryStatusItem,
} from "./types";

export async function editRequestHistoryStatus(
  body: EditRequestHistoryStatusBody,
): Promise<RequestHistoryStatusItem> {
  return apiClient.request<RequestHistoryStatusItem>(
    "/services/app/RequestHistoryStatus/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
