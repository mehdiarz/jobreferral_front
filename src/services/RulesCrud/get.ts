import { apiClient } from "../../libs/api";
import type { RulesItem } from "./types";

export async function getRules(id: number): Promise<RulesItem> {
  return apiClient.request<RulesItem>(`/services/app/Rules/Get?Id=${id}`, {
    method: "GET",
  });
}
