import { apiClient } from "../../libs/api";

export async function viewRequest(requestId: number): Promise<void> {
  await apiClient.request<any>("/services/app/RequestCrud/ViewRequest", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
}
