import { apiClient } from "../../libs/api";
import type { EditRequestBody, RequestItem } from "./types";

interface EditRequestResponse {
  result?: RequestItem;
}

export async function editRequest(body: EditRequestBody): Promise<RequestItem> {
  const response = await apiClient.request<EditRequestResponse>(
    "/services/app/RequestCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return response?.result ?? (response as unknown as RequestItem);
}
