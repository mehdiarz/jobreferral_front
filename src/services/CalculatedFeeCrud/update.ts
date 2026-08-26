import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  CalculatedFeeItem,
  EditCalculatedFeeBody,
} from "./types";

export async function updateCalculatedFee(
  body: EditCalculatedFeeBody,
): Promise<CalculatedFeeItem> {
  const response = await apiClient.request<AbpResponse<CalculatedFeeItem>>(
    "/services/app/CalculatedFee/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return response.result;
}
