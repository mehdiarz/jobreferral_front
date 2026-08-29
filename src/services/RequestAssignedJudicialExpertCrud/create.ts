import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  CreateRequestAssignedJudicialExpertBody,
  RequestAssignedJudicialExpertItem,
} from "./types";

export async function createRequestAssignedJudicialExpert(
  body: CreateRequestAssignedJudicialExpertBody,
): Promise<RequestAssignedJudicialExpertItem | null> {
  const res = await apiClient.request<
    | AbpResponse<RequestAssignedJudicialExpertItem>
    | RequestAssignedJudicialExpertItem
  >("/services/app/RequestAssignedJudicialExpert/Create", {
    method: "POST",
    body: JSON.stringify({
      id: body.id ?? 0,
      requestId: body.requestId,
      userId: body.userId,
      judicialExpertId: body.judicialExpertId,
      calculatedWage: body.calculatedWage ?? 0,
      status: body.status ?? 0,
      isActive: body.isActive ?? true,
    }),
  });

  if (res && "result" in res) {
    return res.result ?? null;
  }

  return (res as RequestAssignedJudicialExpertItem) ?? null;
}
