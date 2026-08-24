import { apiClient } from "../../libs/api";
import type { CreateExpertBody, ExpertItem } from "./types";

export async function createExpert(
  body: CreateExpertBody,
): Promise<ExpertItem> {
  return apiClient.request<ExpertItem>(
    "/services/app/JudicialExpertCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        ...body,
      }),
    },
  );
}
