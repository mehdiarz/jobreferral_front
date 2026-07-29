import { apiClient } from "../../libs/api";
import type { CreateExpertBody } from "./createExpert";

export async function updateExpert(
  body: CreateExpertBody & { id: number },
): Promise<any> {
  return apiClient.request<any>("/services/app/JudicialExpertCrud/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
