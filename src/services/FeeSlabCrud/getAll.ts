import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetAllFeeSlabsParams,
  GetAllFeeSlabsResponse,
} from "./types";

export async function getAllFeeSlabs(
  params: GetAllFeeSlabsParams = {},
): Promise<GetAllFeeSlabsResponse> {
  const searchParams = new URLSearchParams();

  const feeType = params.feeType?.trim();

  if (feeType) {
    searchParams.set("FeeType", feeType);
  }

  if (params.isActive !== undefined) {
    searchParams.set("IsActive", String(params.isActive));
  }

  const queryString = searchParams.toString();

  const response = await apiClient.request<AbpResponse<GetAllFeeSlabsResponse>>(
    `/services/app/FeeSlabCrud/GetAll${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );

  return {
    items: response.result.items ?? [],
    totalCount: response.result.totalCount ?? 0,
  };
}
