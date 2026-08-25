import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetAllFeeSettingsParams,
  GetAllFeeSettingsResponse,
} from "./types";

export async function getAllFeeSettings(
  params: GetAllFeeSettingsParams = {},
): Promise<GetAllFeeSettingsResponse> {
  const searchParams = new URLSearchParams();

  const feeType = params.feeType?.trim();
  const search = params.search?.trim();
  const sorting = params.sorting?.trim();

  if (feeType) {
    searchParams.set("FeeType", feeType);
  }

  if (search) {
    searchParams.set("Search", search);
  }

  if (sorting) {
    searchParams.set("Sorting", sorting);
  }

  if (params.skipCount !== undefined) {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (params.maxResultCount !== undefined) {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const queryString = searchParams.toString();

  const response = await apiClient.request<
    AbpResponse<GetAllFeeSettingsResponse>
  >(
    `/services/app/FeeSettingCrud/GetAll${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
    },
  );

  return {
    items: response.result.items ?? [],
    totalCount: response.result.totalCount ?? 0,
  };
}
