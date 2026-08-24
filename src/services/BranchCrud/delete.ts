import { apiClient } from "../../libs/api";

export async function deleteBranch(id: number): Promise<void> {
  await apiClient.request<void>("/services/app/BranchCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
