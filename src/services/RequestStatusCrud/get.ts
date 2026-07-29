import { apiClient } from "../../libs/api";
import type { RequestStatusItem } from "./types";

export async function getRequestStatus(id: number): Promise<RequestStatusItem> {
  return apiClient.request<RequestStatusItem>(
    `/services/app/RequestStatusCrud/Get?Id=${id}`,
    { method: "GET" },
  );
}
