import { apiClient } from "../../libs/api";
import type { CreateRulesBody, RulesItem } from "./types";

export async function createRules(body: CreateRulesBody): Promise<RulesItem> {
  return apiClient.request<RulesItem>("/services/app/Rules/Create", {
    method: "POST",
    body: JSON.stringify({ id: 0, ...body }),
  });
}
