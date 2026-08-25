import { apiClient } from "../../libs/api";
import type { AbpResponse, CreateExpertBody, ExpertItem } from "./types";

export async function createExpert(
  body: CreateExpertBody,
): Promise<ExpertItem> {
  const response = await apiClient.request<AbpResponse<ExpertItem>>(
    "/services/app/JudicialExpertCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        ...body,
        expertiseZoneIds: body.expertiseZoneIds ?? [],
        regions: body.regions ?? [],
      }),
    },
  );

  return response.result;
}
