import { apiClient } from "../../libs/api";
import type { AbpResponse, RequestAssignedJudicialExpertItem } from "./types";

export async function getRequestAssignedJudicialExpert(
  id: number,
): Promise<RequestAssignedJudicialExpertItem | null> {
  const res = await apiClient.request<
    | AbpResponse<RequestAssignedJudicialExpertItem>
    | RequestAssignedJudicialExpertItem
  >(`/services/app/RequestAssignedJudicialExpert/Get?Id=${id}`, {
    method: "GET",
  });

  if (res && "result" in res) {
    return res.result ?? null;
  }

  return (res as RequestAssignedJudicialExpertItem) ?? null;
}
