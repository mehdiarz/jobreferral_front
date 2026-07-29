import { apiClient } from "../../libs/api";
import type {
  CreateRequestAssignedJudicialExpertBody,
  RequestAssignedJudicialExpertItem,
} from "./types";

export async function createRequestAssignedJudicialExpert(
  body: CreateRequestAssignedJudicialExpertBody,
): Promise<RequestAssignedJudicialExpertItem> {
  return apiClient.request<RequestAssignedJudicialExpertItem>(
    "/services/app/RequestAssignedJudicialExpert/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
