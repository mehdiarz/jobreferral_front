import { apiClient } from "../../libs/api";
import type { EditPersonalTypeBody, PersonalTypeItem } from "./types";

export async function editPersonalType(
  body: EditPersonalTypeBody,
): Promise<PersonalTypeItem> {
  return apiClient.request<PersonalTypeItem>(
    "/services/app/PersonalType/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
