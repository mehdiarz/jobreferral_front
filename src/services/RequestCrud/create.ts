import { apiClient } from "../../libs/api";
import type { CreateRequestBody, RequestItem } from "./types";

interface CreateRequestResponse {
  result?: RequestItem;
}

export async function createRequest(
  body: CreateRequestBody,
): Promise<RequestItem> {
  const response = await apiClient.request<CreateRequestResponse>(
    "/services/app/RequestCrud/Create",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return response?.result ?? (response as unknown as RequestItem);
}
