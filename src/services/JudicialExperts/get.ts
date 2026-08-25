import { apiClient } from "../../libs/api";
import type { AbpResponse, ExpertItem } from "./types";

export async function getExpert(id: number): Promise<ExpertItem> {
  const response = await apiClient.request<AbpResponse<ExpertItem>>(
    `/services/app/JudicialExpertCrud/Get?Id=${id}`,
    {
      method: "GET",
    },
  );

  return response.result;
}
