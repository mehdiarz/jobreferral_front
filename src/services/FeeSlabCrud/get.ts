import { apiClient } from "../../libs/api";
import type { AbpResponse, FeeSlabItem } from "./types";

export async function getFeeSlab(id: number): Promise<FeeSlabItem> {
  const response = await apiClient.request<AbpResponse<FeeSlabItem>>(
    `/services/app/FeeSlabCrud/Get?Id=${id}`,
    {
      method: "GET",
    },
  );

  return response.result;
}
