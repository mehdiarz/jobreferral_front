import { apiClient } from "../../libs/api";
import type { CreatePersonalTypeBody, PersonalTypeItem } from "./types";

export async function createPersonalType(
  body: CreatePersonalTypeBody,
): Promise<PersonalTypeItem> {
  return apiClient.request<PersonalTypeItem>(
    "/services/app/PersonalType/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
