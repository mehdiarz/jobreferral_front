import { apiClient } from "../../libs/api";

export interface DeleteRequestBody {
  id: number;
}

export async function deleteRequest(id: number): Promise<void> {
  await apiClient.request<void>("/services/app/RequestCrud/Remove", {
    method: "POST",
    body: JSON.stringify({
      id,
    } satisfies DeleteRequestBody),
  });
}
