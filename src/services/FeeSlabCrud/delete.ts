import { apiClient } from "../../libs/api";

export async function deleteFeeSlab(id: number): Promise<void> {
  await apiClient.request<unknown>(
    `/services/app/FeeSlabCrud/Remove?Id=${id}`,
    {
      method: "DELETE",
    },
  );
}
