import { apiClient } from "../../libs/api";
import type { CreateCollatralBody, CollatralItem } from "./types";

export async function createCollatral(
  body: CreateCollatralBody,
): Promise<CollatralItem> {
  return apiClient.request<CollatralItem>(
    "/services/app/CollatralCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
