import { apiClient } from "../../libs/api";
import type { EditCollatralBody, CollatralItem } from "./types";

export async function editCollatral(
  body: EditCollatralBody,
): Promise<CollatralItem> {
  return apiClient.request<CollatralItem>("/services/app/CollatralCrud/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
