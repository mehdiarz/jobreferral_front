import { apiClient } from "../../libs/api";
import type { AbpResponse, EditExpertBody, ExpertItem } from "./types";

export async function updateExpert(body: EditExpertBody): Promise<ExpertItem> {
  const response = await apiClient.request<AbpResponse<ExpertItem>>(
    "/services/app/JudicialExpertCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify({
        ...body,
        expertiseZoneIds: body.expertiseZoneIds ?? [],
        regions: body.regions ?? [],
      }),
    },
  );

  return response.result;
}
