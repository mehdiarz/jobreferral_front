import { apiClient } from "../../libs/api";
import type { RequestAssignedJudicialExpertItem } from "./types";

export async function getRequestAssignedJudicialExpert(
  id: number,
): Promise<RequestAssignedJudicialExpertItem> {
  return apiClient.request<RequestAssignedJudicialExpertItem>(
    `/services/app/RequestAssignedJudicialExpert/Get?Id=${id}`,
    { method: "GET" },
  );
}
