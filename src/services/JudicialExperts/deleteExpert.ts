import { apiClient } from "../../libs/api";

export async function deleteExpert(id: number): Promise<void> {
  await apiClient.request<unknown>("/services/app/JudicialExpertCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
