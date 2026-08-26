import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  GetAllRequestSignaturesParams,
  PagedResultDto,
  RequestSignatureOutputDto,
} from "./types";

/**
 * دریافت لیست صفحه‌بندی‌شده امضاهای درخواست
 */
export async function getAllRequestSignatures(
  params: GetAllRequestSignaturesParams = {},
): Promise<PagedResultDto<RequestSignatureOutputDto>> {
  const searchParams = new URLSearchParams();
  if (params.requestId !== undefined) {
    searchParams.set("RequestId", String(params.requestId));
  }

  if (params.sorting) {
    searchParams.set("Sorting", params.sorting);
  }

  if (params.skipCount !== undefined) {
    searchParams.set("SkipCount", String(params.skipCount));
  }

  if (params.maxResultCount !== undefined) {
    searchParams.set("MaxResultCount", String(params.maxResultCount));
  }

  const queryString = searchParams.toString();

  const response = await apiClient.request<
    AbpResponse<PagedResultDto<RequestSignatureOutputDto>>
  >(
    `/services/app/RequestSignatureCrud/GetAll${
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
