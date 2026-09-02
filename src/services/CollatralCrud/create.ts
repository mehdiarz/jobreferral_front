import { apiClient } from "../../libs/api";
import type { CreateCollatralBody, CollatralItem } from "./types";

export async function createCollatral(
  body: CreateCollatralBody,
): Promise<CollatralItem> {
  const payload = {
    id: body.id ?? 0,
    collatralTypeId: body.collatralTypeId ?? null,
    requestId: body.requestId,
    firstName: body.firstName ?? null,
    lastName: body.lastName ?? null,
    nationalCode: body.nationalCode ?? null,
    personTypeId: body.personTypeId ?? 1,
    expertiseZoneCodes: body.expertiseZoneCodes ?? [],
  };

  const res = await apiClient.request<
    { result?: CollatralItem } | CollatralItem
  >("/services/app/CollatralCrud/Create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return (res as any)?.result ?? res;
}
