import { apiClient } from "../../libs/api";
import type { PersonalTypeItem } from "./types";

export async function getPersonalType(id: number): Promise<PersonalTypeItem> {
  return apiClient.request<PersonalTypeItem>(
    `/services/app/PersonalType/Get?Id=${id}`,
    { method: "GET" },
  );
}
