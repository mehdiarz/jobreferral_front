import { apiClient } from "../../libs/api";
import type {
  CreateRequestHistoryStatusBody,
  RequestHistoryStatusItem,
} from "./types";

export async function createRequestHistoryStatus(
  body: CreateRequestHistoryStatusBody,
): Promise<RequestHistoryStatusItem> {
  return apiClient.request<RequestHistoryStatusItem>(
    "/services/app/RequestHistoryStatus/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
