import { apiClient } from "../../libs/api";
import type {
  EditRequestAssignedJudicialExpertBody,
  RequestAssignedJudicialExpertItem,
} from "./types";

export async function editRequestAssignedJudicialExpert(
  body: EditRequestAssignedJudicialExpertBody,
): Promise<RequestAssignedJudicialExpertItem> {
  return apiClient.request<RequestAssignedJudicialExpertItem>(
    "/services/app/RequestAssignedJudicialExpert/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
