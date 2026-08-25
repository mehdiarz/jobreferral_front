import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  RequestAssignedJudicialExpertOutputDto,
} from "./types";

/**
 * تخصیص دستی کارشناسان رسمی دادگستری به درخواست
 *
 * @param reqId شناسه درخواست
 * @param judicialExpertIds آرایه شناسه کارشناسان منتخب
 */
export async function assignManual(
  reqId: number,
  judicialExpertIds: number[],
): Promise<RequestAssignedJudicialExpertOutputDto[]> {
  const response = await apiClient.request<
    AbpResponse<RequestAssignedJudicialExpertOutputDto[]>
  >(`/services/app/Assign/AssignManual?reqId=${reqId}`, {
    method: "POST",
    body: JSON.stringify(judicialExpertIds),
  });

  return response.result;
}
