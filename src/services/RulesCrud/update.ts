import { apiClient } from "../../libs/api";
import type { EditRulesBody, RulesItem } from "./types";

export async function editRules(body: EditRulesBody): Promise<RulesItem> {
  return apiClient.request<RulesItem>("/services/app/Rules/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
