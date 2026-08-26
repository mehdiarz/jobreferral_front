import { apiClient } from "../../libs/api";
import type { AbpResponse, CalculatedFeeItem } from "./types";

export async function getCalculatedFee(id: number): Promise<CalculatedFeeItem> {
  const response = await apiClient.request<AbpResponse<CalculatedFeeItem>>(
    `/services/app/CalculatedFee/Get?Id=${id}`,
    {
      method: "GET",
    },
  );

  return response.result;
}
