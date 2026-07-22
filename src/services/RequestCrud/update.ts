import { apiClient } from "../../libs/api";
import type { EditRequestBody, RequestItem } from "./types";

export async function editRequest(body: EditRequestBody): Promise<RequestItem> {
  return apiClient.request<RequestItem>("/services/app/RequestCrud/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
