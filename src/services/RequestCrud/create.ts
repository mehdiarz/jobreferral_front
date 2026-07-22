import { apiClient } from "../../libs/api";
import type { CreateRequestBody, RequestItem } from "./types";

export async function createRequest(
  body: CreateRequestBody,
): Promise<RequestItem> {
  return apiClient.request<RequestItem>("/services/app/RequestCrud/Create", {
    method: "POST",
    body: JSON.stringify({ id: 0, ...body }),
  });
}
