import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  RequestSignatureInputDto,
  RequestSignatureOutputDto,
} from "./types";

/**
 * ثبت امضای جدید برای درخواست
 */
export async function createRequestSignature(
  body: RequestSignatureInputDto,
): Promise<RequestSignatureOutputDto> {
  const response = await apiClient.request<
    AbpResponse<RequestSignatureOutputDto>
  >("/services/app/RequestSignatureCrud/Create", {
    method: "POST",
    body: JSON.stringify({
      id: 0,
      ...body,
    }),
  });

  return response.result;
}
