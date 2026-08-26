import { apiClient } from "../../libs/api";

export async function deleteCalculatedFee(id: number): Promise<void> {
  await apiClient.request<unknown>("/services/app/CalculatedFee/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
