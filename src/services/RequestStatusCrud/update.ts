import { apiClient } from "../../libs/api";
import type { EditRequestStatusBody, RequestStatusItem } from "./types";

export async function editRequestStatus(
  body: EditRequestStatusBody,
): Promise<RequestStatusItem> {
  return apiClient.request<RequestStatusItem>(
    "/services/app/RequestStatusCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
