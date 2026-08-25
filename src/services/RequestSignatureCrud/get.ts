import { apiClient } from "../../libs/api";
import type { AbpResponse, RequestSignatureOutputDto } from "./types";

/**
 * دریافت یک امضای درخواست بر اساس شناسه
 */
export async function getRequestSignature(
  id: number,
): Promise<RequestSignatureOutputDto> {
  const response = await apiClient.request<
    AbpResponse<RequestSignatureOutputDto>
  >(`/services/app/RequestSignatureCrud/Get?Id=${id}`, {
    method: "GET",
  });

  return response.result;
}
