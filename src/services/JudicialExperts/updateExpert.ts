import { apiClient } from "../../libs/api";
import type { EditExpertBody, ExpertItem } from "./types";

export async function updateExpert(body: EditExpertBody): Promise<ExpertItem> {
  return apiClient.request<ExpertItem>(
    "/services/app/JudicialExpertCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
