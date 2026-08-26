import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  CalculatedFeeItem,
  CreateCalculatedFeeBody,
} from "./types";

export async function createCalculatedFee(
  body: CreateCalculatedFeeBody,
): Promise<CalculatedFeeItem> {
  const response = await apiClient.request<AbpResponse<CalculatedFeeItem>>(
    "/services/app/CalculatedFee/Create",
    {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        ...body,
      }),
    },
  );

  return response.result;
}
