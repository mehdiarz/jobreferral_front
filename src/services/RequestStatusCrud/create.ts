import { apiClient } from "../../libs/api";
import type { CreateRequestStatusBody, RequestStatusItem } from "./types";

export async function createRequestStatus(
  body: CreateRequestStatusBody,
): Promise<RequestStatusItem> {
  return apiClient.request<RequestStatusItem>(
    "/services/app/RequestStatusCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
