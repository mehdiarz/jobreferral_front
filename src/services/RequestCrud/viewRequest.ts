import { apiClient } from "../../libs/api";

export interface ViewRequestBody {
  requestId: number;
}

export async function viewRequest(requestId: number): Promise<void> {
  await apiClient.request<void>("/services/app/RequestCrud/ViewRequest", {
    method: "POST",
    body: JSON.stringify({
      requestId,
    } satisfies ViewRequestBody),
  });
}
